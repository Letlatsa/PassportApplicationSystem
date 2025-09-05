import React, { useState } from 'react';
import { QrCode, Search, User, CheckCircle, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';

export default function CollectionInterface() {
  const [scannedData, setScannedData] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  React.useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        qrbox: { width: 250, height: 250 },
        fps: 5
      }, false);

      scanner.render(
        (decodedText) => {
          setScannedData(decodedText);
          setShowScanner(false);
          scanner.clear();
          searchApplication(decodedText);
        },
        (error) => {
          console.log('QR scan error:', error);
        }
      );

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [showScanner]);

  const searchApplication = async (reference: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('passport_applications')
        .select('*')
        .or(`reference_number.eq.${reference},qr_code.eq.${reference}`)
        .single();

      if (error) {
        alert('Application not found');
        setApplication(null);
      } else {
        setApplication(data);
      }
    } catch (err) {
      alert('Error searching for application');
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const markAsCollected = async () => {
    if (!application) return;

    const { error } = await supabase
      .from('passport_applications')
      .update({ 
        status: 'collected',
        updated_at: new Date().toISOString()
      })
      .eq('id', application.id);

    if (!error) {
      await supabase
        .from('application_status_updates')
        .insert([{
          application_id: application.id,
          status: 'collected',
          notes: 'Passport collected at collection point',
          updated_by: 'collection_staff'
        }]);

      alert('Passport marked as collected successfully!');
      setApplication(null);
      setManualRef('');
      setScannedData('');
    } else {
      alert('Error updating collection status');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Collection Interface</h1>
          <p className="text-gray-600">
            Scan QR code or enter reference number to verify and process passport collection
          </p>
        </div>

        {/* Search Methods */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Scan QR Code
            </h3>
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              {showScanner ? 'Stop Scanner' : 'Start QR Scanner'}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Manual Search
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                placeholder="Enter reference number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => searchApplication(manualRef)}
                disabled={!manualRef || loading}
                className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* QR Scanner */}
        {showScanner && (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg">
            <div id="qr-reader" className="w-full"></div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Searching for application...</p>
          </div>
        )}

        {/* Application Details */}
        {application && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Application Found
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Applicant Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {application.first_name} {application.last_name}</p>
                  <p><span className="font-medium">Reference:</span> {application.reference_number}</p>
                  <p><span className="font-medium">Email:</span> {application.email}</p>
                  <p><span className="font-medium">Phone:</span> {application.phone}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Application Status</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Current Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      application.status === 'ready_for_collection' 
                        ? 'bg-purple-100 text-purple-800'
                        : application.status === 'collected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {application.status.replace('_', ' ')}
                    </span>
                  </p>
                  <p><span className="font-medium">Applied:</span> {new Date(application.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {application.status === 'ready_for_collection' ? (
              <div className="flex justify-center">
                <button
                  onClick={markAsCollected}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mark as Collected
                </button>
              </div>
            ) : application.status === 'collected' ? (
              <div className="text-center text-green-600">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Already Collected</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center">
                  <X className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 text-sm">
                    This passport is not ready for collection yet. Current status: {application.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}