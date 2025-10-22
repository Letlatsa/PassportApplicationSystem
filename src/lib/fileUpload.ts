import { supabase } from './supabase';

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export class FileUploadService {
  private static readonly BUCKET_NAME = 'passport-documents';

  /**
   * Initialize the storage bucket if it doesn't exist
   */
  static async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists by trying to list it
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        console.warn('Could not list buckets:', error);
        return;
      }

      const bucketExists = data?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        console.log(`Bucket ${this.BUCKET_NAME} does not exist. Please create it manually in Supabase dashboard.`);
        console.log('Go to: Storage → Create bucket → name: passport-documents → make it public');
        throw new Error(`Storage bucket '${this.BUCKET_NAME}' does not exist. Please create it in your Supabase dashboard.`);
      } else {
        console.log(`Bucket ${this.BUCKET_NAME} exists and is ready for uploads`);
      }
    } catch (error) {
      console.error('Error initializing bucket:', error);
      throw error;
    }
  }

  /**
   * Upload a file to Supabase Storage
   */
  static async uploadFile(
    file: File,
    applicationId: string,
    documentType: string
  ): Promise<UploadedFile> {
    try {
      // Create a unique filename
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${applicationId}/${documentType}_${timestamp}.${fileExtension}`;

      console.log(`Uploading file: ${fileName} (${file.size} bytes)`);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error details:', error);
        throw new Error(`Failed to upload ${documentType}: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log('Public URL generated:', urlData.publicUrl);

      return {
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files for an application
   */
  static async uploadApplicationFiles(
    applicationId: string,
    files: {
      idDocument?: File;
      birthCertificate?: File;
      proofOfAddress?: File;
      proofOfPayment?: File;
      passportPhoto?: File;
    }
  ): Promise<{
    id_document_url?: string;
    birth_certificate_url?: string;
    proof_of_address_url?: string;
    proof_of_payment_url?: string;
    passport_photo_url?: string;
  }> {
    const uploadPromises: Promise<void>[] = [];
    const results: Record<string, string> = {};

    // Upload each file type
    if (files.idDocument) {
      uploadPromises.push(
        this.uploadFile(files.idDocument, applicationId, 'id_document')
          .then(file => { results.id_document_url = file.url; })
      );
    }

    if (files.birthCertificate) {
      uploadPromises.push(
        this.uploadFile(files.birthCertificate, applicationId, 'birth_certificate')
          .then(file => { results.birth_certificate_url = file.url; })
      );
    }

    if (files.proofOfAddress) {
      uploadPromises.push(
        this.uploadFile(files.proofOfAddress, applicationId, 'proof_of_address')
          .then(file => { results.proof_of_address_url = file.url; })
      );
    }

    if (files.proofOfPayment) {
      uploadPromises.push(
        this.uploadFile(files.proofOfPayment, applicationId, 'proof_of_payment')
          .then(file => { results.proof_of_payment_url = file.url; })
      );
    }

    if (files.passportPhoto) {
      uploadPromises.push(
        this.uploadFile(files.passportPhoto, applicationId, 'passport_photo')
          .then(file => { results.passport_photo_url = file.url; })
      );
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    return results;
  }

  /**
   * Delete a file from Supabase Storage
   */
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const applicationId = urlParts[urlParts.length - 2];
      const filePath = `${applicationId}/${fileName}`;

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      console.error('File delete error:', error);
      throw error;
    }
  }

  /**
   * Check if a file URL is accessible
   */
  static async isFileAccessible(fileUrl: string): Promise<boolean> {
    try {
      const response = await fetch(fileUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}