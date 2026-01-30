import { useState } from 'react';
import { AlertTriangle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const SOSButton = ({ emergencyContacts = [] }) => {
  const [showDialog, setShowDialog] = useState(false);
  
  const handleSOSClick = () => {
    setShowDialog(true);
    // In production, this could trigger location sharing, alerts, etc.
  };
  
  return (
    <>
      <Button
        data-testid="sos-button"
        onClick={handleSOSClick}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-destructive text-white hover:bg-destructive/90 hover:scale-110 shadow-[0_0_30px_-5px_rgba(249,115,22,0.8)] transition-all z-50"
      >
        <AlertTriangle className="h-8 w-8" />
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-destructive/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Emergency SOS
            </DialogTitle>
            <DialogDescription className="text-base">
              Dial any of these emergency numbers for immediate assistance
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {emergencyContacts.map((contact, index) => (
              <a
                key={index}
                href={`tel:${contact.number}`}
                className="block p-4 rounded-lg bg-slate-950/50 border border-white/10 hover:border-primary/50 transition-all hover:scale-105"
                data-testid={`emergency-contact-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{contact.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{contact.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold text-primary">{contact.number}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-center">
              Your location: <span className="font-mono text-primary">Tracking...</span>
            </p>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Location will be shared with emergency services when you call
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};