import React, { useState } from 'react';
import { X, Download, Eye, FileText, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';

interface DocumentViewerProps {
  documents: Array<{
    name: string;
    url: string;
    type?: string;
  }>;
  onClose: () => void;
}

export default function DocumentViewer({ documents, onClose }: DocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState(documents[0]);
  const [zoom, setZoom] = useState(1);

  if (!selectedDocument) return null;

  const isImage = selectedDocument.type?.startsWith('image/') ||
                  selectedDocument.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const isPDF = selectedDocument.type === 'application/pdf' ||
                selectedDocument.url.match(/\.pdf$/i);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = selectedDocument.url;
    link.download = selectedDocument.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Document Viewer
            </h3>
            <span className="text-sm text-gray-500">
              {selectedDocument.name}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {isImage && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document List Sidebar */}
        {documents.length > 1 && (
          <div className="border-r border-gray-200 w-64 flex-shrink-0">
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Documents</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {documents.map((doc, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedDocument(doc);
                      setZoom(1);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDocument === doc
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {doc.type?.startsWith('image/') || doc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      <span className="text-sm truncate">{doc.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Document Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <div className="flex items-center justify-center h-full">
            {isImage ? (
              <img
                src={selectedDocument.url}
                alt={selectedDocument.name}
                className="max-w-full max-h-full object-contain"
                style={{ transform: `scale(${zoom})` }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.png'; // Fallback image
                }}
              />
            ) : isPDF ? (
              <iframe
                src={selectedDocument.url}
                className="w-full h-full min-h-[600px] border-0"
                title={selectedDocument.name}
              />
            ) : (
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  This document type is not supported for preview.
                </p>
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download to View
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for use in modals
interface DocumentPreviewProps {
  documents: Array<{
    name: string;
    url: string;
    type?: string;
  }>;
  className?: string;
}

export function DocumentPreview({ documents, className = '' }: DocumentPreviewProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  if (!documents || documents.length === 0) {
    return (
      <p className="text-sm text-gray-400">No documents uploaded</p>
    );
  }

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {documents.map((doc, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-3">
              {doc.type?.startsWith('image/') || doc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <ImageIcon className="w-5 h-5 text-green-600" />
              ) : (
                <FileText className="w-5 h-5 text-blue-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                <p className="text-xs text-gray-500">
                  {doc.type || 'Document'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setViewerOpen(true)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              <span>View</span>
            </button>
          </div>
        ))}
      </div>

      {viewerOpen && (
        <DocumentViewer
          documents={documents}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}