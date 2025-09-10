import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Flag, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ReportModalProps {
  targetType?: 'post' | 'comment' | 'user';
  targetId?: string;
  targetTitle?: string;
  reportedPostId?: string;
  reportedCommentId?: string;
  reportedUserId?: string;
  children: React.ReactNode;
}

const ReportModalEnhanced: React.FC<ReportModalProps> = ({
  targetType,
  targetId,
  targetTitle,
  reportedPostId,
  reportedCommentId,
  reportedUserId,
  children
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportReasons = [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'violence', label: 'Violence' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'fake_news', label: 'Fake News' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async () => {
    if (!user || !reason) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Check rate limit
      const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_action_type: 'reporting',
        p_max_attempts: 10, // 10 reports per hour
        p_window_minutes: 60
      });

      if (rateLimitError) throw rateLimitError;
      if (!rateLimitOk) {
        toast.error('Rate limit exceeded. Please wait before submitting more reports.');
        return;
      }

      // Prepare report data
      const reportData: any = {
        reporter_id: user.id,
        report_type: reason,
        reason: description.trim() || null
      };

      // Set target based on props
      if (reportedPostId) {
        reportData.reported_post_id = reportedPostId;
      }
      if (reportedCommentId) {
        reportData.reported_comment_id = reportedCommentId;
      }
      if (reportedUserId) {
        reportData.reported_user_id = reportedUserId;
      }
      
      // Fallback to old props for backward compatibility
      if (targetType === 'post' && targetId) {
        reportData.reported_post_id = targetId;
      } else if (targetType === 'comment' && targetId) {
        reportData.reported_comment_id = targetId;
      } else if (targetType === 'user' && targetId) {
        reportData.reported_user_id = targetId;
      }

      const { error: reportError } = await supabase
        .from('reports')
        .insert(reportData);

      if (reportError) throw reportError;

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action_type: 'create_report',
          target_type: targetType,
          target_id: targetId,
          details: { reason, description: description.trim() }
        });

      toast.success('Report submitted successfully');
      setIsOpen(false);
      setReason('');
      setDescription('');
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit report');
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetDisplayName = () => {
    switch (targetType) {
      case 'post':
        return targetTitle || 'this post';
      case 'comment':
        return targetTitle || 'this comment';
      case 'user':
        return targetTitle || 'this user';
      default:
        return 'this content';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Flag className="h-5 w-5 text-red-600" />
            <span>Report {getTargetDisplayName()}</span>
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((reasonOption) => (
                  <SelectItem key={reasonOption.value} value={reasonOption.value}>
                    {reasonOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Please provide any additional context that might help us understand the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-500">
              {description.length}/500 characters
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Reports are reviewed by our moderation team. False reports may result in account restrictions.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModalEnhanced;