'use client';

import { DmModal } from './DmModal';
import { Button } from '@/components/shadcn/ui/button';
import { MessageSquare } from 'lucide-react';

interface DmButtonProps {
    recipientUserId: number;
    recipientUsername: string;
}

export function DmButton({ recipientUserId, recipientUsername }: DmButtonProps) {
    return (
        <DmModal recipientUserId={recipientUserId} recipientUsername={recipientUsername}>
            <Button variant="ghost" size="icon" className="text-[#818384] hover:text-white hover:bg-[#262729]">
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">Send Direct Message</span>
            </Button>
        </DmModal>
    );
} 