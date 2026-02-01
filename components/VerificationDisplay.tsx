
import React from 'react';
// FIX: The `VerifiedStockData` type is not exported from types.ts. The `Company` type, which has the necessary data, is used instead.
import { Company } from '../types';

interface VerificationDisplayProps {
    data: Company;
}

const VerificationDisplay: React.FC<VerificationDisplayProps> = ({ data }) => {
    return (
        <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Verification Successful</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-semibold text-gray-600">Company Name:</div>
                {/* FIX: The `Company` type uses `name` instead of `companyName`. */}
                <div className="text-gray-900">{data.name}</div>

                <div className="font-semibold text-gray-600">Ticker:</div>
                <div className="text-gray-900">{data.ticker}</div>
                
                <div className="font-semibold text-gray-600">Exchange:</div>
                <div className="text-gray-900">{data.exchange}</div>

                <div className="font-semibold text-gray-600">Current Price:</div>
                {/* FIX: The `Company` type uses a single `currentPrice` string. */}
                <div className="text-gray-900">{data.currentPrice}</div>

                <div className="font-semibold text-gray-600">Market Cap:</div>
                <div className="text-gray-900">{data.marketCap}</div>
            </div>
        </div>
    );
};

export default VerificationDisplay;