import { Link } from '@tanstack/react-router';
import React from 'react';
import { MdLocationOn, MdTrendingUp, MdPerson, MdCheckCircle } from 'react-icons/md';

interface FeedCampaignProps {
    campaign: {
        id: string;
        title: string;
        description: string;
        goal_amount: number;
        current_amount: number;
        status: string;
        entrepreneur_id?: string;
        region?: string;
        images?: Array<{ image_url: string; alt_text?: string; order_index?: number }>;
    };
    percent: number;
    progressClass: string;
    isFollowing: boolean;
    onFollowToggle: (entrepreneurId: string) => void;
    onDetails: (id: string) => void;
}

const getImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    return `http://127.0.0.1:8000${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
};

const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
        active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktywna' },
        draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Szkic' },
        successful: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sukces' },
        failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Nieudana' },
    };
    const statusStyle = statusMap[status] || statusMap.draft;
    return { ...statusStyle, status };
};

const FeedCampaign: React.FC<FeedCampaignProps> = ({ campaign, percent, progressClass, isFollowing, onFollowToggle, onDetails }) => {
    const images = campaign.images && Array.isArray(campaign.images) ? campaign.images : [];
    const firstImage = images.length > 0 ? images[0] : null;
    const imageUrl = firstImage?.image_url ? getImageUrl(firstImage.image_url) : null;
    const statusBadge = getStatusBadge(campaign.status);

    return (
        <div 
            className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-100 cursor-pointer"
            onClick={() => onDetails(campaign.id)}
        >
            {/* Zdjęcie */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={firstImage?.alt_text || campaign.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-lg">Brak zdjęcia</span>
                    </div>
                )}
                {/* Status badge na zdjęciu */}
                <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.bg} ${statusBadge.text} shadow-lg`}>
                        {statusBadge.label}
                    </span>
                </div>
            </div>

            {/* Treść */}
            <div className="p-6">
                {/* Tytuł */}
                <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-green-600 transition-colors">
                    {campaign.title}
                </h3>

                {/* Opis */}
                {campaign.description && (
                    <p className="text-gray-600 line-clamp-2 leading-relaxed mb-4 text-sm">
                        {campaign.description}
                    </p>
                )}

                {/* Postęp zbiórki */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-500">Postęp zbiórki</span>
                        <span className="text-lg font-bold text-green-600">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs">
                        <span className="text-gray-600">
                            <span className="font-bold text-green-600">{campaign.current_amount.toLocaleString('pl-PL')} PLN</span>
                        </span>
                        <span className="text-gray-500">
                            z <span className="font-semibold">{campaign.goal_amount.toLocaleString('pl-PL')} PLN</span>
                        </span>
                    </div>
                </div>

                {/* Region */}
                {campaign.region && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                        <MdLocationOn className="text-lg" />
                        <span>{campaign.region}</span>
                    </div>
                )}

                {/* Przyciski */}
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                    {campaign.entrepreneur_id && (
                        <div className="flex items-center justify-between mb-2">
                            <Link
                                to={`/profile/${campaign.entrepreneur_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                                <MdPerson className="text-lg" />
                                Zobacz profil
                            </Link>
                        </div>
                    )}
                    <div className="flex gap-2">
                        {campaign.entrepreneur_id && (
                            <button
                                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                    isFollowing
                                        ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                                        : 'bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-100'
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFollowToggle(campaign.entrepreneur_id!);
                                }}
                            >
                                {isFollowing ? 'Odobserwuj' : 'Obserwuj'}
                            </button>
                        )}
                        <button 
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDetails(campaign.id);
                            }}
                        >
                            Szczegóły
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedCampaign;
