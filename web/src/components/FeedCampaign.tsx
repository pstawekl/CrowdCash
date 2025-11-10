import { Link } from '@tanstack/react-router';
import React from 'react';

interface FeedCampaignProps {
    campaign: {
        id: string;
        title: string;
        description: string;
        goal_amount: number;
        current_amount: number;
        status: string;
        entrepreneur_id?: string;
    };
    percent: number;
    progressClass: string;
    isFollowing: boolean;
    onFollowToggle: (entrepreneurId: string) => void;
    onDetails: (id: string) => void;
}

const FeedCampaign: React.FC<FeedCampaignProps> = ({ campaign, percent, progressClass, isFollowing, onFollowToggle, onDetails }) => (
    <div className="w-full bg-white rounded shadow p-4">
        <div className="w-full flex flex-col justify-between items-center gap-2">
            <div className='flex flex-col gap-4'>
                <h3 className="flex font-semibold text-2xl text-black justify-center">{campaign.title}</h3>
                <p className="text-gray-600 line-clamp-3">{campaign.description}</p>
                <div className="flex flex-col flex-wrap gap-1 text-sm text-black">
                    <span className="font-medium">Cel: <span className="font-normal">{campaign.goal_amount} PLN</span></span>
                    <span className="font-medium">Zebrano: <span className="font-normal">{campaign.current_amount} PLN</span></span>
                    <span className="font-medium">Status: <span className="font-normal">{campaign.status}</span></span>
                </div>
                {campaign.entrepreneur_id && (
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Przedsiębiorca:</span>
                            <Link
                                to={`/profile/${campaign.entrepreneur_id}`}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                                {campaign.entrepreneur_id}
                            </Link>
                        </div>
                        <div className='flex flex-row items-center gap-2'>
                            <button
                                className={`btn ${isFollowing ? 'btn-outline' : 'btn-success'}`}
                                onClick={() => onFollowToggle(campaign.entrepreneur_id!)}
                            >
                                {isFollowing ? 'Odobserwuj' : 'Obserwuj'}
                            </button>
                            <button className="btn btn-primary w-full" onClick={() => onDetails(campaign.id)}>
                                Szczegóły
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="w-full flex flex-row gap-2 min-w-[120px] w-full items-center justify-center">
                <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                    <div className={`bg-green-500 h-2 rounded-full absolute top-0 left-0 transition-all duration-500 ${progressClass}`} />
                </div>
                <span className="whitespace-nowrap text-xs text-gray-500">{percent}% celu</span>
            </div>
        </div>
    </div>
);

export default FeedCampaign;
