import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Phone, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ApplicationFormData } from '../../pages/Apply';

interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  district: string;
  contact_person: string;
  contact_phone: string;
  is_active: boolean;
}

interface CollectionPointStepProps {
  formData: ApplicationFormData & { collectionPointId?: string };
  updateFormData: (data: ApplicationFormData & { collectionPointId?: string }) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function CollectionPointStep({ formData, updateFormData, onNext, onPrev }: CollectionPointStepProps) {
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  useEffect(() => {
    fetchCollectionPoints();
  }, []);

  const fetchCollectionPoints = async () => {
    const { data, error } = await supabase
      .from('collection_points')
      .select('*')
      .eq('is_active', true)
      .order('district', { ascending: true });

    if (data) {
      setCollectionPoints(data);
    }
    setLoading(false);
  };

  const districts = [...new Set(collectionPoints.map(cp => cp.district))];

  const filteredPoints = selectedDistrict === 'all' 
    ? collectionPoints 
    : collectionPoints.filter(cp => cp.district === selectedDistrict);

  const handleCollectionPointSelect = (pointId: string) => {
    updateFormData({
      ...formData,
      collectionPointId: pointId
    });
  };

  const validateAndNext = () => {
    if (!formData.collectionPointId) {
      alert('Please select a collection point before proceeding.');
      return;
    }
    onNext();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading collection points...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Collection Point</h2>
        <p className="text-gray-600">
          Select where you would like to collect your passport when it's ready.
        </p>
      </div>

      {/* District Filter */}
      <div className="mb-6">
        <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by District
        </label>
        <select
          id="district"
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Districts</option>
          {districts.map(district => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>
      </div>

      {/* Collection Points */}
      <div className="space-y-4 mb-8">
        {filteredPoints.map((point) => (
          <div 
            key={point.id} 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              formData.collectionPointId === point.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handleCollectionPointSelect(point.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">{point.name}</h3>
                  {formData.collectionPointId === point.id && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                
                <div className="space-y-1 text-gray-600 text-sm">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{point.address}, {point.district}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{point.contact_phone}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Monday - Friday: 8:00 AM - 4:30 PM</span>
                  </div>
                </div>
              </div>

              <div className="ml-4">
                <input
                  type="radio"
                  name="collectionPoint"
                  value={point.id}
                  checked={formData.collectionPointId === point.id}
                  onChange={() => handleCollectionPointSelect(point.id)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPoints.length === 0 && (
        <div className="text-center py-8">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Collection Points Found</h3>
          <p className="text-gray-600">
            No active collection points found in the selected district.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onPrev}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        <button
          type="button"
          onClick={validateAndNext}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
        >
          Next Step
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}