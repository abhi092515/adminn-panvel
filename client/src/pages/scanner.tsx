import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  QrCode,
  Camera,
  Check,
  X,
  User,
  Clock,
  CreditCard,
  Star,
  AlertTriangle,
  Droplets,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import type { Booking, Customer, Court } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getPaymentStatusColor } from "@/lib/constants";
import { Html5Qrcode } from "html5-qrcode";

type ScanResult = {
  bookingId: string;
  booking: Booking | null;
  customer: Customer | null;
  court: Court | null;
  status: "valid" | "invalid" | "not_found";
};

function ScannerView({ onScan }: { onScan: (data: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("qr-reader");
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText);
            html5QrCode?.stop();
            setScanning(false);
          },
          () => {}
        );
        setScanning(true);
        setError(null);
      } catch (err) {
        setError("Unable to access camera. Please ensure camera permissions are granted.");
        console.error("Scanner error:", err);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && scanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan, scanning]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div
        id="qr-reader"
        className="w-full aspect-square bg-black rounded-lg overflow-hidden"
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg p-6">
          <div className="text-center text-white">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-lg">
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
        </div>
      </div>
    </div>
  );
}

function ScanResultCard({
  result,
  onCheckIn,
  onCollectPayment,
  onAddUpsell,
  onReportIssue,
  onClose,
  isLoading,
}: {
  result: ScanResult;
  onCheckIn: () => void;
  onCollectPayment: () => void;
  onAddUpsell: () => void;
  onReportIssue: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const { booking, customer, court, status } = result;

  if (status === "not_found") {
    return (
      <Card className="border-red-500">
        <CardContent className="p-6 text-center">
          <X className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Booking Not Found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            The scanned QR code doesn't match any booking
          </p>
          <Button onClick={onClose} data-testid="button-scan-again">
            Scan Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!booking || !customer || !court) {
    return null;
  }

  const isPaid = booking.paymentStatus === "paid";
  const isCheckedIn = booking.status === "checked_in";

  return (
    <Card className={isPaid ? "border-green-500" : "border-orange-500"}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isPaid ? (
              <Check className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-orange-500" />
            )}
            <span
              className={`font-semibold ${
                isPaid ? "text-green-500" : "text-orange-500"
              }`}
            >
              {isPaid ? "Booking Valid" : "Payment Pending"}
            </span>
          </div>
          <Badge variant="outline">{court.name}</Badge>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{customer.name}</h3>
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
            <div className="flex gap-1 mt-1">
              {customer.tags.includes("VIP") && (
                <Badge className="bg-amber-500 text-white text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  VIP
                </Badge>
              )}
              {customer.tags.includes("HIGH_RISK") && (
                <Badge className="bg-red-500 text-white text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High Risk
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3 w-3" />
              Time Slot
            </div>
            <p className="font-medium">
              {booking.startTime} - {booking.endTime}
            </p>
          </div>
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CreditCard className="h-3 w-3" />
              Payment
            </div>
            <p className="font-medium">
              ₹{booking.paidAmount} / ₹{booking.totalAmount}
            </p>
            <Badge
              variant="outline"
              className={`mt-1 text-xs ${getPaymentStatusColor(
                booking.paymentStatus
              )}`}
            >
              {booking.paymentStatus}
            </Badge>
          </div>
        </div>

        {!isPaid && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md mb-4">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Collect ₹{Number(booking.totalAmount) - Number(booking.paidAmount)} Balance
            </p>
          </div>
        )}

        <div className="space-y-2">
          {!isCheckedIn && (
            <Button
              className="w-full"
              size="lg"
              onClick={onCheckIn}
              disabled={isLoading}
              data-testid="button-check-in"
            >
              <Check className="h-5 w-5 mr-2" />
              {isLoading ? "Processing..." : "Check In"}
            </Button>
          )}

          {!isPaid && (
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={onCollectPayment}
              data-testid="button-collect-payment"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Collect UPI Payment
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onAddUpsell} data-testid="button-add-upsell">
              <Droplets className="h-4 w-4 mr-2" />
              Add Water
            </Button>
            <Button variant="outline" onClick={onReportIssue} data-testid="button-report-issue">
              <AlertCircle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Scanner() {
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showScanner, setShowScanner] = useState(true);

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: courts } = useQuery<Court[]>({
    queryKey: ["/api/courts"],
  });

  const checkInMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest("PATCH", `/api/bookings/${bookingId}`, {
        status: "checked_in",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({ title: "Check-in successful!" });
      setScanResult(null);
      setShowScanner(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScan = useCallback(
    (data: string) => {
      const bookingIdMatch = data.match(/BOOKING:(.+)/);
      if (!bookingIdMatch) {
        setScanResult({
          bookingId: "",
          booking: null,
          customer: null,
          court: null,
          status: "not_found",
        });
        setShowScanner(false);
        return;
      }

      const bookingId = bookingIdMatch[1];
      const booking = bookings?.find((b) => b.id === bookingId || b.qrCode === data);

      if (!booking) {
        setScanResult({
          bookingId,
          booking: null,
          customer: null,
          court: null,
          status: "not_found",
        });
      } else {
        const customer = customers?.find((c) => c.id === booking.customerId);
        const court = courts?.find((c) => c.id === booking.courtId);

        setScanResult({
          bookingId: booking.id,
          booking,
          customer: customer || null,
          court: court || null,
          status: "valid",
        });
      }
      setShowScanner(false);
    },
    [bookings, customers, courts]
  );

  const handleCheckIn = () => {
    if (scanResult?.booking) {
      checkInMutation.mutate(scanResult.booking.id);
    }
  };

  const handleCollectPayment = () => {
    toast({ title: "Opening UPI payment..." });
  };

  const handleAddUpsell = () => {
    toast({ title: "Water bottle added to bill" });
  };

  const handleReportIssue = () => {
    toast({ title: "Opening issue reporter..." });
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setShowScanner(true);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-4">
            <Smartphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Mobile Mode</span>
          </div>
          <h1 className="text-2xl font-semibold">QR Scanner</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Scan customer tickets for quick check-in
          </p>
        </div>

        {showScanner ? (
          <Card>
            <CardContent className="p-4">
              <ScannerView onScan={handleScan} />
              <p className="text-center text-sm text-muted-foreground mt-4">
                Point camera at the booking QR code
              </p>
            </CardContent>
          </Card>
        ) : scanResult ? (
          <ScanResultCard
            result={scanResult}
            onCheckIn={handleCheckIn}
            onCollectPayment={handleCollectPayment}
            onAddUpsell={handleAddUpsell}
            onReportIssue={handleReportIssue}
            onClose={handleScanAgain}
            isLoading={checkInMutation.isPending}
          />
        ) : null}

        {!showScanner && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleScanAgain}
            data-testid="button-new-scan"
          >
            <QrCode className="h-4 w-4 mr-2" />
            New Scan
          </Button>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:hidden">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              setScanResult(null);
              setShowScanner(true);
            }}
            data-testid="button-floating-scan"
          >
            <QrCode className="h-5 w-5 mr-2" />
            Scan QR Code
          </Button>
        </div>
      </div>
    </div>
  );
}
