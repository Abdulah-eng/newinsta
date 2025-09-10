import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Flag } from "lucide-react";

interface ReportModalProps {
  children: React.ReactNode;
  reportedUserId?: string;
  reportedPostId?: string;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  "Inappropriate Content",
  "Harassment or Bullying",
  "Spam or Scam",
  "Violence or Threats",
  "Hate Speech",
  "Nudity or Sexual Content",
  "Impersonation",
  "Copyright Violation",
  "Other"
];

const ReportModal = ({ 
  children, 
  reportedUserId, 
  reportedPostId, 
  onReportSubmitted 
}: ReportModalProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to report content.",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting.",
        variant: "destructive",
      });
      return;
    }

    if (!reportedUserId && !reportedPostId) {
      toast({
        title: "Error",
        description: "Invalid report target.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId || null,
          reported_post_id: reportedPostId || null,
          reason,
          description: description.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for your report. We'll review it shortly.",
      });

      setOpen(false);
      setReason("");
      setDescription("");

      if (onReportSubmitted) {
        onReportSubmitted();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getReportType = () => {
    if (reportedUserId && reportedPostId) {
      return "post and user";
    } else if (reportedUserId) {
      return "user";
    } else if (reportedPostId) {
      return "post";
    }
    return "content";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-charcoal border-gold/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gold font-serif flex items-center">
            <Flag className="mr-2 h-5 w-5" />
            Report {getReportType()}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Help us keep the community safe by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white">Reason for reporting</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-black border-gold/30 text-white focus:border-gold">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent className="bg-charcoal border-gold/30">
                {REPORT_REASONS.map((reportReason) => (
                  <SelectItem 
                    key={reportReason} 
                    value={reportReason}
                    className="text-white focus:bg-gold/20 focus:text-gold"
                  >
                    {reportReason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context that might help us understand the issue..."
              className="bg-black border-gold/30 text-white focus:border-gold min-h-[100px]"
              maxLength={500}
            />
            <p className="text-white/50 text-xs">{description.length}/500 characters</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !reason}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
