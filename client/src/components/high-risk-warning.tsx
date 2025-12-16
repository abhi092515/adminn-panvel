import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield } from "lucide-react";
import type { Customer } from "@shared/schema";

interface HighRiskWarningProps {
  customer: Customer | null;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function HighRiskWarning({
  customer,
  open,
  onConfirm,
  onCancel,
}: HighRiskWarningProps) {
  if (!customer) return null;

  const isHighRisk = customer.tags?.includes("HIGH_RISK") || customer.isBlacklisted;
  const noShowRate = customer.totalBookings > 0
    ? Math.round((customer.noShowCount / customer.totalBookings) * 100)
    : 0;

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            High Risk Customer Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-md border border-destructive/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Total Bookings</span>
                  <Badge variant="secondary">{customer.totalBookings}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>No-Shows</span>
                  <Badge variant="destructive">{customer.noShowCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>No-Show Rate</span>
                  <Badge variant={noShowRate > 20 ? "destructive" : "secondary"}>
                    {noShowRate}%
                  </Badge>
                </div>
                {customer.isBlacklisted && (
                  <div className="mt-2 p-2 bg-destructive/20 rounded text-destructive font-medium">
                    This customer is BLACKLISTED
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm">
              This customer has been flagged as high risk due to previous no-shows or
              payment issues. Are you sure you want to proceed with this booking?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} data-testid="button-cancel-high-risk">
            Cancel Booking
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground"
            data-testid="button-confirm-high-risk"
          >
            Proceed Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface VipBadgeProps {
  customer: Customer;
  showLabel?: boolean;
}

export function VipBadge({ customer, showLabel = true }: VipBadgeProps) {
  const isVip = customer.tags?.includes("VIP");
  
  if (!isVip) return null;

  return (
    <Badge className="bg-amber-500 text-white text-xs">
      {showLabel ? "VIP Customer" : "VIP"}
    </Badge>
  );
}

export function CustomerRiskIndicator({ customer }: { customer: Customer }) {
  const isHighRisk = customer.tags?.includes("HIGH_RISK") || customer.isBlacklisted;
  const isVip = customer.tags?.includes("VIP");

  if (isHighRisk) {
    return (
      <Badge variant="destructive" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        High Risk
      </Badge>
    );
  }

  if (isVip) {
    return (
      <Badge className="bg-amber-500 text-white text-xs">
        VIP
      </Badge>
    );
  }

  return null;
}
