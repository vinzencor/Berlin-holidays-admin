import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, User, Mail, Phone, MapPin, Calendar, Home, Users, CreditCard } from "lucide-react";
import { format, parseISO } from "date-fns";

interface CustomerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
}

export const CustomerDetailsDialog = ({ open, onOpenChange, booking }: CustomerDetailsDialogProps) => {
  if (!booking) return null;

  const customerProofs = booking.customer_proofs || [];
  const totalGuests = (booking.number_of_adults || 0) + (booking.number_of_children || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#006938]">
            Customer & Booking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="border-[#c49d71]">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-[#006938] mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-[#006938] mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-semibold">{booking.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#006938] mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{booking.customer_email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#006938] mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{booking.customer_phone}</p>
                  </div>
                </div>
                {(booking.home_address || booking.city || booking.state || booking.country || booking.pin_code) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#006938] mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <div className="font-semibold">
                        {booking.home_address && <p>{booking.home_address}</p>}
                        {(booking.city || booking.state || booking.pin_code) && (
                          <p>{[booking.city, booking.state, booking.pin_code].filter(Boolean).join(", ")}</p>
                        )}
                        {booking.country && <p>{booking.country}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Booking Information */}
          <Card className="border-[#c49d71]">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-[#006938] mb-4 flex items-center gap-2">
                <Home className="w-5 h-5" />
                Booking Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Home className="w-4 h-4 text-[#006938] mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Room</p>
                    <p className="font-semibold">{booking.room_name}</p>
                    {booking.room_number && (
                      <p className="text-xs text-gray-500">{booking.room_number}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-[#006938] mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Guests</p>
                    <p className="font-semibold">
                      {booking.number_of_adults} Adults, {booking.number_of_children} Children
                    </p>
                    <p className="text-xs text-gray-500">Total: {totalGuests} guests</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#006938] mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="font-semibold">
                      {format(parseISO(booking.check_in_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#006938] mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="font-semibold">
                      {format(parseISO(booking.check_out_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="default">{booking.status}</Badge>
                      <Badge variant="secondary">{booking.payment_status}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card className="border-[#c49d71]">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-[#006938] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-[#006938]">
                    ₹{booking.total_amount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{booking.paid_amount?.toLocaleString() || 0}
                  </p>
                </div>
                {booking.discount_amount > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Discount</p>
                    <p className="text-xl font-semibold text-red-600">
                      -₹{booking.discount_amount?.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Remaining Balance</p>
                  <p className="text-2xl font-bold text-[#c49d71]">
                    ₹{((booking.total_amount || 0) - (booking.paid_amount || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer ID Proofs */}
          {customerProofs.length > 0 && (
            <Card className="border-[#c49d71]">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-[#006938] mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Customer ID Proofs ({customerProofs.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {customerProofs.map((proofUrl: string, index: number) => (
                    <a
                      key={index}
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-[#c49d71]">
                        <CardContent className="p-4 text-center">
                          {proofUrl.endsWith('.pdf') ? (
                            <div className="flex flex-col items-center gap-2">
                              <Download className="w-12 h-12 text-[#006938]" />
                              <p className="text-sm font-medium">ID Proof {index + 1}</p>
                              <p className="text-xs text-gray-500">PDF Document</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <img
                                src={proofUrl}
                                alt={`ID Proof ${index + 1}`}
                                className="w-full h-32 object-cover rounded"
                              />
                              <p className="text-sm font-medium">ID Proof {index + 1}</p>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full border-[#c49d71] text-[#006938]"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            View/Download
                          </Button>
                        </CardContent>
                      </Card>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special Requests */}
          {booking.special_requests && (
            <Card className="border-[#c49d71]">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-[#006938] mb-2">Special Requests</h3>
                <p className="text-gray-700">{booking.special_requests}</p>
              </CardContent>
            </Card>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-[#c49d71]">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[#006938] hover:bg-[#00552d] text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

