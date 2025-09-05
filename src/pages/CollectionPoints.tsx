import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  operating_hours: string;
  is_active: boolean;
}

export default function CollectionPoints() {
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Collection Points</h1>
        <p className="text-gray-600">
          Choose a convenient location to collect your passport when ready
        </p>
      </div>

      {/* District Filter */}
      <div className="mb-8">
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

      {/* Collection Points Grid */}
      <div className="grid gap-6">
        {filteredPoints.map((point) => (
          <div key={point.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 mr-3">{point.name}</h3>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm">{point.address}, {point.district}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm">{point.phone}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm">{point.operating_hours}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 lg:mt-0 lg:ml-6">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                    Select This Point
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPoints.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Collection Points Found</h3>
          <p className="text-gray-600">
            No active collection points found in the selected district.
          </p>
        </div>
      )}
    </div>
  );
}