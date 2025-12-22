import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Upload, X, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { eachDayOfInterval, format as formatDate } from "date-fns";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  onSuccess: () => void;
}

export const BookingDialog = ({ open, onOpenChange, item, onSuccess }: BookingDialogProps) => {
  const [formData, setFormData] = useState({
    room_id: "",
    room_name: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    home_address: "",
    city: "",
    state: "",
    country: "",
    pin_code: "",
    check_in_date: "",
    check_in_time: "13:00",
    check_out_date: "",
    check_out_time: "11:00",
    number_of_adults: "2",
    number_of_children: "0",
    total_amount: "",
    advance_payment: "",
    discount_amount: "0",
    payment_method: "cash",
    payment_status: "pending",
    status: "confirmed",
    special_requests: "",
    booking_type: "walk-in",
    reference_id: "",
    reference_name: "",
    reference_details: "",
    gst_amount: "0",
  });

  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<any[]>([]);
  const [customerProofs, setCustomerProofs] = useState<File[]>([]);
  const [uploadedProofUrls, setUploadedProofUrls] = useState<string[]>([]);
  const [roomPrice, setRoomPrice] = useState(0);
  const [numberOfNights, setNumberOfNights] = useState(1);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [references, setReferences] = useState<any[]>([]);

  // Helper function to calculate per-night price for a room considering date-specific pricing
  const calculateRoomPricePerNight = async (roomId: string, checkInDate: string, checkOutDate: string) => {
    if (!checkInDate || !checkOutDate) return 0;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Get all dates in the range (excluding checkout date)
    const dates = eachDayOfInterval({ start: checkIn, end: new Date(checkOut.getTime() - 1) });

    // Fetch date-specific pricing for this room
    const { data: dateSpecificPrices, error } = await supabase
      .from("date_specific_pricing")
      .select("*")
      .eq("room_type_id", roomId)
      .gte("date", formatDate(checkIn, "yyyy-MM-dd"))
      .lte("date", formatDate(checkOut, "yyyy-MM-dd"));

    if (error) {
      console.error("Error fetching date-specific pricing:", error);
    }

    // Get the room's base price
    const room = availableRooms.find(r => r.id === roomId);
    const basePrice = room?.base_price || 0;

    // Calculate total price for all nights
    let totalPrice = 0;
    dates.forEach(date => {
      const dateStr = formatDate(date, "yyyy-MM-dd");
      const specificPrice = dateSpecificPrices?.find(p => p.date === dateStr);
      totalPrice += specificPrice ? parseFloat(specificPrice.price) : parseFloat(basePrice);
    });

    // Return AVERAGE per-night price (total / number of nights)
    return dates.length > 0 ? totalPrice / dates.length : basePrice;
  };

  // Fetch available room types and references
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from("room_types")
          .select("*")
          .eq("is_active", true)
          .eq("status", "available")
          .order("name");

        if (roomsError) throw roomsError;
        setAvailableRooms(roomsData || []);

        // Fetch references
        const { data: referencesData, error: referencesError } = await supabase
          .from("booking_references")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (referencesError) throw referencesError;
        setReferences(referencesData || []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data: " + error.message);
      }
    };

    if (open) {
      fetchData();
      setSelectedRooms([]); // Reset selected rooms when dialog opens
    }
  }, [open]);

  // Fetch booked dates for availability checking
  useEffect(() => {
    const fetchBookedDates = async () => {
      if (!formData.check_in_date || !formData.check_out_date) return;

      try {
        const { data: bookings, error } = await supabase
          .from("bookings")
          .select("check_in_date, check_in_time, check_out_date, check_out_time, room_id")
          .neq("status", "cancelled");

        if (error) throw error;

        const bookedDatesList: string[] = [];
        bookings?.forEach((booking) => {
          // Create check-in and check-out datetimes
          const checkInDateTime = new Date(`${booking.check_in_date}T${booking.check_in_time || '14:00'}`);
          const checkOutDateTime = new Date(`${booking.check_out_date}T${booking.check_out_time || '12:00'}`);

          // Create proposed check-in and check-out datetimes
          const proposedCheckIn = new Date(`${formData.check_in_date}T${formData.check_in_time || '14:00'}`);
          const proposedCheckOut = new Date(`${formData.check_out_date}T${formData.check_out_time || '12:00'}`);

          // Check for overlap: booking overlaps if it starts before proposed ends AND ends after proposed starts
          if (checkInDateTime < proposedCheckOut && checkOutDateTime > proposedCheckIn) {
            // If there's an overlap, mark all dates in the booking period as booked
            const dates = eachDayOfInterval({ start: checkInDateTime, end: checkOutDateTime });
            dates.forEach((date) => {
              bookedDatesList.push(formatDate(date, "yyyy-MM-dd"));
            });
          }
        });

        setBookedDates(bookedDatesList);
      } catch (error) {
        console.error("Error fetching booked dates:", error);
      }
    };

    if (open) {
      fetchBookedDates();
    }
  }, [open, formData.check_in_date, formData.check_out_date, formData.check_in_time, formData.check_out_time]);

  // Calculate number of nights when dates change (FIXED: check-in to check-out = nights between)
  useEffect(() => {
    if (formData.check_in_date && formData.check_out_date) {
      const checkIn = new Date(formData.check_in_date);
      const checkOut = new Date(formData.check_out_date);
      // Calculate nights: difference in days (e.g., 28th to 29th = 1 night)
      const nights = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      setNumberOfNights(nights > 0 ? nights : 1);
    }
  }, [formData.check_in_date, formData.check_out_date]);

  // Recalculate room prices when dates change (considering date-specific pricing)
  useEffect(() => {
    const recalculatePrices = async () => {
      if (selectedRooms.length > 0 && formData.check_in_date && formData.check_out_date) {
        let totalPerNightPrice = 0;
        for (const room of selectedRooms) {
          const roomPerNightPrice = await calculateRoomPricePerNight(
            room.id,
            formData.check_in_date,
            formData.check_out_date
          );
          totalPerNightPrice += roomPerNightPrice;
        }
        setRoomPrice(totalPerNightPrice); // Store combined per-night rate
      }
    };

    recalculatePrices();
  }, [formData.check_in_date, formData.check_out_date, selectedRooms]);

  // Calculate total amount when room price or discount changes (GST is now editable)
  useEffect(() => {
    if (roomPrice > 0 && numberOfNights > 0) {
      const discount = parseFloat(formData.discount_amount) || 0;
      const subtotal = roomPrice * numberOfNights; // roomPrice is per-night average
      const baseAmount = subtotal - discount;
      setFormData(prev => ({
        ...prev,
        total_amount: baseAmount.toFixed(2),
      }));
    }
  }, [roomPrice, formData.discount_amount, numberOfNights]);

  useEffect(() => {
    if (item) {
      setFormData({
        room_id: item.room_id || "",
        room_name: item.room_name || "",
        customer_name: item.customer_name || "",
        customer_email: item.customer_email || "",
        customer_phone: item.customer_phone || "",
        customer_address: item.customer_address || "",
        home_address: item.home_address || "",
        city: item.city || "",
        state: item.state || "",
        country: item.country || "",
        pin_code: item.pin_code || "",
        check_in_date: item.check_in_date || "",
        check_in_time: item.check_in_time || "14:00",
        check_out_date: item.check_out_date || "",
        check_out_time: item.check_out_time || "12:00",
        number_of_adults: item.number_of_adults?.toString() || "2",
        number_of_children: item.number_of_children?.toString() || "0",
        total_amount: item.total_amount || "",
        advance_payment: item.advance_payment || "",
        discount_amount: item.discount_amount || "0",
        payment_method: item.payment_method || "cash",
        payment_status: item.payment_status || "pending",
        status: item.status || "confirmed",
        special_requests: item.special_requests || "",
        booking_type: item.booking_type || "walk-in",
        reference_id: item.reference_id || "",
        reference_name: item.reference_name || "",
        reference_details: item.reference_details || "",
        gst_amount: item.gst_amount || "0",
      });
      // Set room price from existing booking
      if (item.room_price) {
        setRoomPrice(parseFloat(item.room_price));
      }
      if (item.customer_proofs) {
        setUploadedProofUrls(item.customer_proofs);
      }
    } else {
      setFormData({
        room_id: "",
        room_name: "",
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        home_address: "",
        city: "",
        state: "",
        country: "",
        pin_code: "",
        check_in_date: "",
        check_in_time: "14:00",
        check_out_date: "",
        check_out_time: "12:00",
        number_of_adults: "2",
        number_of_children: "0",
        total_amount: "",
        advance_payment: "",
        discount_amount: "0",
        payment_method: "cash",
        payment_status: "pending",
        status: "confirmed",
        special_requests: "",
        booking_type: "walk-in",
        reference_id: "",
        reference_name: "",
        reference_details: "",
        gst_amount: "0",
      });
      setCustomerProofs([]);
      setUploadedProofUrls([]);
    }
  }, [item]);

  const handleAddRoom = async (roomId: string) => {
    const selectedRoom = availableRooms.find(r => r.id === roomId);
    if (selectedRoom && !selectedRooms.find(r => r.id === roomId)) {
      // Allow multiple room selection
      const updatedRooms = [...selectedRooms, selectedRoom];
      setSelectedRooms(updatedRooms);

      // Update form data with first room's details (for primary room reference)
      if (selectedRooms.length === 0) {
        setFormData(prev => ({
          ...prev,
          room_id: roomId,
          room_name: selectedRoom.name,
        }));
      }

      // Calculate total PER-NIGHT price for all selected rooms (considering date-specific pricing)
      if (formData.check_in_date && formData.check_out_date) {
        let totalPerNightPrice = 0;
        for (const room of updatedRooms) {
          const roomPerNightPrice = await calculateRoomPricePerNight(
            room.id,
            formData.check_in_date,
            formData.check_out_date
          );
          totalPerNightPrice += roomPerNightPrice;
        }
        setRoomPrice(totalPerNightPrice); // Store combined per-night rate
        console.log('Room price calculated with dates:', totalPerNightPrice);
      } else {
        // Fallback to base price if dates not selected
        const totalPerNightPrice = updatedRooms.reduce((sum, room) => sum + Number(room.base_price), 0);
        setRoomPrice(totalPerNightPrice);
        console.log('Room price set to base price:', totalPerNightPrice);
      }
    }
  };

  const handleRemoveRoom = (roomId: string) => {
    setSelectedRooms(prev => {
      const updated = prev.filter(r => r.id !== roomId);

      // Update form data
      if (updated.length > 0) {
        setFormData(prevForm => ({
          ...prevForm,
          room_id: updated[0].id,
          room_name: updated.map(r => r.name).join(", "),
        }));
        // Recalculate total price
        const totalPrice = updated.reduce((sum, room) => sum + Number(room.base_price), 0);
        setRoomPrice(totalPrice);
      } else {
        setFormData(prevForm => ({
          ...prevForm,
          room_id: "",
          room_name: "",
        }));
        setRoomPrice(0);
      }

      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setCustomerProofs(prev => [...prev, ...files]);
    }
  };

  const removeProof = (index: number) => {
    setCustomerProofs(prev => prev.filter((_, i) => i !== index));
  };

  const uploadProofs = async () => {
    const urls: string[] = [];

    for (const file of customerProofs) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `customer-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('bookings')
        .upload(filePath, file);

      if (!uploadError) {
        const { data } = supabase.storage.from('bookings').getPublicUrl(filePath);
        urls.push(data.publicUrl);
      }
    }

    return urls;
  };

  const generateAdvanceInvoice = async (bookingData: any) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 105, 56);
    doc.text("BERLIN HOLIDAYS", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Vayanad, Kerala, India", 105, 28, { align: "center" });
    doc.text("Phone: +91 9876543210 | Email: info@berlinholidays.com", 105, 34, { align: "center" });

    // Invoice title
    doc.setFontSize(16);
    doc.setTextColor(196, 157, 113);
    doc.text("ADVANCE PAYMENT INVOICE", 105, 45, { align: "center" });

    // Invoice details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, 55);
    doc.text(`Booking ID: ${bookingData.id?.substring(0, 8).toUpperCase()}`, 20, 62);

    // Customer details
    doc.setFontSize(12);
    doc.setTextColor(0, 105, 56);
    doc.text("Customer Details:", 20, 75);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${formData.customer_name}`, 20, 83);
    doc.text(`Email: ${formData.customer_email}`, 20, 90);
    doc.text(`Phone: ${formData.customer_phone}`, 20, 97);

    let yPos = 104;
    if (formData.home_address) {
      doc.text(`Address: ${formData.home_address}`, 20, yPos);
      yPos += 7;
    }
    if (formData.city || formData.state || formData.pin_code) {
      const cityStatePin = [formData.city, formData.state, formData.pin_code].filter(Boolean).join(", ");
      doc.text(cityStatePin, 20, yPos);
      yPos += 7;
    }
    if (formData.country) {
      doc.text(formData.country, 20, yPos);
      yPos += 7;
    }

    // Booking details
    doc.setFontSize(12);
    doc.setTextColor(0, 105, 56);
    doc.text("Booking Details:", 20, 117);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Room: ${formData.room_name}`, 20, 125);
    doc.text(`Check-in: ${formData.check_in_date} at ${formData.check_in_time}`, 20, 132);
    doc.text(`Check-out: ${formData.check_out_date} at ${formData.check_out_time}`, 20, 139);
    doc.text(`Number of Nights: ${numberOfNights}`, 20, 146);
    doc.text(`Guests: ${formData.number_of_adults} Adults, ${formData.number_of_children} Children`, 20, 153);
    doc.text(`Payment Method: ${formData.payment_method.toUpperCase()}`, 20, 160);

    // Payment table
    const tableData = [
      ["Room Charges", `${numberOfNights} nights × ₹${roomPrice}`, `₹${(roomPrice * numberOfNights).toFixed(2)}`],
    ];

    if (parseFloat(formData.discount_amount) > 0) {
      tableData.push(["Discount", "", `-₹${parseFloat(formData.discount_amount).toFixed(2)}`]);
    }

    const subtotal = parseFloat(formData.total_amount);
    const advancePaid = parseFloat(formData.advance_payment) || 0;
    const remaining = subtotal - advancePaid;

    tableData.push(
      ["", "Subtotal", `₹${subtotal.toFixed(2)}`],
      ["", "Advance Paid", `₹${advancePaid.toFixed(2)}`],
      ["", "Remaining Balance", `₹${remaining.toFixed(2)}`]
    );

    autoTable(doc, {
      startY: 172,
      head: [["Description", "Details", "Amount"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [0, 105, 56] },
      footStyles: { fillColor: [196, 157, 113], textColor: [255, 255, 255] },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 220;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for choosing Berlin Holidays!", 105, finalY + 15, { align: "center" });
    doc.text("We look forward to hosting you!", 105, finalY + 22, { align: "center" });

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${bookingData.id?.substring(0, 8).toUpperCase()}`;

    // Save invoice to database
    try {
      const { error: invoiceError } = await supabase.from("invoices").insert({
        invoice_number: invoiceNumber,
        booking_id: bookingData.id,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        home_address: formData.home_address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pin_code: formData.pin_code,
        room_name: formData.room_name,
        check_in_date: formData.check_in_date,
        check_in_time: formData.check_in_time,
        check_out_date: formData.check_out_date,
        check_out_time: formData.check_out_time,
        number_of_nights: numberOfNights,
        base_amount: roomPrice * numberOfNights,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        tax_amount: 0,
        total_amount: subtotal,
        paid_amount: advancePaid,
        balance: remaining,
        payment_status: remaining <= 0 ? "paid" : advancePaid > 0 ? "partial" : "unpaid",
        payment_method: formData.payment_method,
        notes: `Advance payment invoice. ${formData.special_requests || ""}`,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: formData.check_in_date,
      });

      if (invoiceError) {
        console.error("Error saving invoice:", invoiceError);
      } else {
        // Update booking with invoice number
        await supabase
          .from("bookings")
          .update({ invoice_number: invoiceNumber })
          .eq("id", bookingData.id);
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
    }

    // Save PDF
    doc.save(`Invoice_${invoiceNumber}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Get current logged-in staff user
      const { data: { user } } = await supabase.auth.getUser();

      // Upload customer proofs
      let proofUrls = [...uploadedProofUrls];
      if (customerProofs.length > 0) {
        const newUrls = await uploadProofs();
        proofUrls = [...proofUrls, ...newUrls];
      }

      const totalGuests = parseInt(formData.number_of_adults) + parseInt(formData.number_of_children);

      // Validate number of proofs matches number of guests
      if (proofUrls.length < totalGuests && !item) {
        toast.error(`Please upload ${totalGuests} customer ID proofs (one per guest)`);
        return;
      }

      // Get staff_id from staff table using user_id
      let staffId = null;
      if (user?.id) {
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!staffError && staffData) {
          staffId = staffData.id;
        }
      }

      const dataToSave = {
        room_id: formData.room_id,
        room_name: formData.room_name,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        home_address: formData.home_address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pin_code: formData.pin_code,
        check_in_date: formData.check_in_date,
        check_in_time: formData.check_in_time,
        check_out_date: formData.check_out_date,
        check_out_time: formData.check_out_time,
        number_of_adults: parseInt(formData.number_of_adults),
        number_of_children: parseInt(formData.number_of_children),
        // total_guests is a generated column - don't insert it
        number_of_nights: numberOfNights,
        room_price: roomPrice,
        total_amount: parseFloat(formData.total_amount),
        advance_payment: parseFloat(formData.advance_payment) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        paid_amount: parseFloat(formData.advance_payment) || 0,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        status: formData.status,
        special_requests: formData.special_requests,
        customer_proofs: proofUrls,
        booking_type: formData.booking_type,
        reference_id: formData.reference_id || null,
        reference_name: formData.reference_name || null,
        reference_details: formData.reference_details || null,
        gst_amount: parseFloat(formData.gst_amount),
        staff_id: staffId,
      };

      let savedBooking: any;
      if (item) {
        const { data, error } = await supabase
          .from("bookings")
          .update(dataToSave)
          .eq("id", item.id)
          .select()
          .single();

        if (error) throw error;
        savedBooking = data;
      } else {
        // Get all selected rooms
        const roomsToBook = selectedRooms.length > 0 ? selectedRooms :
          (formData.room_id ? [availableRooms.find(r => r.id === formData.room_id)] : []);

        if (roomsToBook.length === 0 || !roomsToBook[0]) {
          toast.error("Please select at least one room!");
          return;
        }

        // Check if all rooms are available
        for (const room of roomsToBook) {
          const { data: roomData, error: roomCheckError } = await supabase
            .from("room_types")
            .select("status")
            .eq("id", room.id)
            .single();

          if (roomCheckError) throw roomCheckError;

          if (roomData.status !== "available") {
            toast.error(`${room.name} is already booked or not available!`);
            return;
          }
        }

        // Update dataToSave with all room names
        dataToSave.room_name = roomsToBook.map(r => r.name).join(", ");
        dataToSave.room_id = roomsToBook[0].id; // Store first room as primary reference

        // Create the booking
        const { data, error } = await supabase
          .from("bookings")
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        savedBooking = data;

        // Create booking_rooms entries for all selected rooms
        const bookingRoomsData = roomsToBook.map(room => ({
          booking_id: savedBooking.id,
          room_type_id: room.id,
        }));

        const { error: bookingRoomsError } = await supabase
          .from("booking_rooms")
          .insert(bookingRoomsData);

        if (bookingRoomsError) throw bookingRoomsError;

        // Update all selected rooms status to booked
        for (const room of roomsToBook) {
          await supabase
            .from("room_types")
            .update({ status: "booked" })
            .eq("id", room.id);
        }

        toast.success(`${roomsToBook.length} room(s) booked successfully!`);
      }

      toast.success(`Booking ${item ? "updated" : "created"} successfully`);

      // Generate and download advance invoice if advance payment is made
      if (parseFloat(formData.advance_payment) > 0) {
        await generateAdvanceInvoice(savedBooking);
        toast.success("Advance invoice downloaded!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to save booking: " + error.message);
      console.error(error);
    }
  };

  const totalGuests = parseInt(formData.number_of_adults || "0") + parseInt(formData.number_of_children || "0");
  const totalAmount = parseFloat(formData.total_amount || "0");
  const gstAmount = parseFloat(formData.gst_amount || "0");
  const advancePayment = formData.advance_payment && formData.advance_payment !== "" ? parseFloat(formData.advance_payment) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#006938]">
            {item ? "Edit" : "Add New"} Booking
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Customer Information */}
          <div className="space-y-4 p-4 bg-[#f9f3e8] rounded-lg border border-[#c49d71]">
            <h3 className="font-semibold text-[#006938] text-lg">Customer Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Phone Number *</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  required
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_email">Email Address *</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                required
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <Label htmlFor="home_address">Home Address</Label>
              <Input
                id="home_address"
                value={formData.home_address}
                onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                placeholder="Street address, apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
              <div>
                <Label htmlFor="pin_code">Pin Code</Label>
                <Input
                  id="pin_code"
                  value={formData.pin_code}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                  placeholder="Pin code"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="booking_type">Booking Type *</Label>
                <Select
                  value={formData.booking_type}
                  onValueChange={(value) => setFormData({ ...formData, booking_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.booking_type === "walk-in" && (
              <div>
                <Label htmlFor="reference_id">Reference (Travel Agency/Partner) - Optional</Label>
                <Select
                  value={formData.reference_id || undefined}
                  onValueChange={(value) => setFormData({ ...formData, reference_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reference (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {references.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No references available</div>
                    ) : (
                      references.map((ref) => (
                        <SelectItem key={ref.id} value={ref.id}>
                          {ref.name} {ref.contact_person ? `(${ref.contact_person})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.reference_id && (
                  <p className="text-sm text-gray-600 mt-1">
                    {references.find(r => r.id === formData.reference_id)?.phone &&
                      `Phone: ${references.find(r => r.id === formData.reference_id)?.phone}`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Booking Dates & Guests - MOVED ABOVE ROOM SELECTION */}
          <div className="space-y-4 p-4 bg-[#f9f3e8] rounded-lg border border-[#c49d71]">
            <h3 className="font-semibold text-[#006938] text-lg">Booking Dates & Guests</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_in_date">Check-in Date *</Label>
                <Input
                  id="check_in_date"
                  type="date"
                  value={formData.check_in_date}
                  onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="check_in_time">Check-in Time *</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_out_date">Check-out Date *</Label>
                <Input
                  id="check_out_date"
                  type="date"
                  value={formData.check_out_date}
                  onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                  required
                  min={formData.check_in_date || new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="check_out_time">Check-out Time *</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Number of Nights</Label>
                <Input
                  value={numberOfNights}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number_of_adults">Number of Adults *</Label>
                <Input
                  id="number_of_adults"
                  type="number"
                  min="1"
                  value={formData.number_of_adults}
                  onChange={(e) => setFormData({ ...formData, number_of_adults: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="number_of_children">Number of Children</Label>
                <Input
                  id="number_of_children"
                  type="number"
                  min="0"
                  value={formData.number_of_children}
                  onChange={(e) => setFormData({ ...formData, number_of_children: e.target.value })}
                />
              </div>
            </div>

            <div className="p-3 bg-white rounded border border-[#c49d71]">
              <p className="text-sm text-[#006938]">
                <strong>Total Guests:</strong> {totalGuests}
                <span className="ml-4 text-red-600">
                  (Please upload {totalGuests} ID proofs below)
                </span>
              </p>
            </div>
          </div>

          {/* Room Selection */}
          <div className="space-y-4 p-4 bg-[#f9f3e8] rounded-lg border border-[#c49d71]">
            <h3 className="font-semibold text-[#006938] text-lg">Room Selection</h3>
            {!formData.check_in_date || !formData.check_out_date ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please select check-in and check-out dates first to see available rooms.
                </p>
              </div>
            ) : null}

            {!item && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="room_select">Add Room *</Label>
                  <Select
                    onValueChange={handleAddRoom}
                    value=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a room to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No rooms available</div>
                      ) : (
                        (() => {
                          const numberOfAdults = parseInt(formData.number_of_adults || "0");
                          const filteredRooms = availableRooms
                            .filter(room => !selectedRooms.find(sr => sr.id === room.id))
                            .filter(room => room.capacity >= numberOfAdults); // Filter by capacity

                          if (filteredRooms.length === 0) {
                            return (
                              <div className="p-2 text-sm text-gray-500">
                                No rooms available for {numberOfAdults} adult(s)
                              </div>
                            );
                          }

                          return filteredRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name} - Capacity: {room.capacity} (₹{Number(room.base_price).toLocaleString()}/night)
                            </SelectItem>
                          ));
                        })()
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Selected Rooms */}
            {selectedRooms.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Rooms ({selectedRooms.length})</Label>
                <div className="space-y-2">
                  {selectedRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#006938]"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-[#006938]">
                          {room.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Capacity: {room.capacity} • ₹{Number(room.base_price).toLocaleString()}/night
                        </p>
                      </div>
                      {!item && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRoom(room.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#006938] text-white rounded-lg space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Per Night Rate:</span>
                    <span className="font-semibold">₹{roomPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Number of Nights:</span>
                    <span className="font-semibold">{numberOfNights}</span>
                  </div>
                  <div className="border-t border-white/30 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-lg">₹{(roomPrice * numberOfNights).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer ID Proofs Upload */}
          <div className="space-y-4 p-4 bg-[#f9f3e8] rounded-lg border border-[#c49d71]">
            <h3 className="font-semibold text-[#006938] text-lg">
              Customer ID Proofs * (Upload {totalGuests} proofs)
            </h3>

            <div className="space-y-2">
              <Label htmlFor="customer_proofs" className="cursor-pointer">
                <div className="flex items-center gap-2 p-4 border-2 border-dashed border-[#c49d71] rounded-lg hover:bg-white transition-colors">
                  <Upload className="w-5 h-5 text-[#006938]" />
                  <span className="text-sm text-[#006938]">
                    Click to upload ID proofs (Aadhar, Passport, Driving License, etc.)
                  </span>
                </div>
              </Label>
              <Input
                id="customer_proofs"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Display uploaded files */}
            {customerProofs.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#006938]">Selected Files:</p>
                {customerProofs.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-[#c49d71]">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProof(index)}
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Display already uploaded proofs (for edit mode) */}
            {uploadedProofUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#006938]">Uploaded Proofs:</p>
                {uploadedProofUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-[#c49d71]">
                    <span className="text-sm">Proof {index + 1}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Button type="button" variant="ghost" size="sm">
                        <Download className="w-4 h-4 text-[#006938]" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Payment Details */}
          <div className="space-y-4 p-4 bg-[#f9f3e8] rounded-lg border border-[#c49d71]">
            <h3 className="font-semibold text-[#006938] text-lg">Payment Details</h3>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="discount_amount">Discount Amount (₹)</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Total Amount (₹)</Label>
                <Input
                  value={`₹${parseFloat(formData.total_amount || "0").toFixed(2)}`}
                  disabled
                  className="bg-gray-100 font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="gst_amount">GST Amount (₹) - Optional</Label>
                <Input
                  id="gst_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.gst_amount}
                  onChange={(e) => setFormData({ ...formData, gst_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="advance_payment">Advance Payment (₹)</Label>
                <Input
                  id="advance_payment"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.total_amount}
                  value={formData.advance_payment}
                  onChange={(e) => setFormData({ ...formData, advance_payment: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border-2 border-[#006938]">
              <h4 className="font-semibold text-[#006938] mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">₹{(roomPrice * numberOfNights).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                {parseFloat(formData.discount_amount || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-semibold text-red-600">-₹{parseFloat(formData.discount_amount || "0").toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-semibold">₹{totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                {parseFloat(formData.gst_amount || "0") > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST:</span>
                    <span className="font-semibold">₹{parseFloat(formData.gst_amount || "0").toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-700 font-semibold">Total with GST:</span>
                  <span className="font-bold text-[#006938]">₹{(totalAmount + parseFloat(formData.gst_amount || "0")).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                {advancePayment > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advance Paid:</span>
                      <span className="font-semibold text-green-600">₹{advancePayment.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#c49d71]">
                      <span className="text-gray-700 font-semibold">Remaining Balance:</span>
                      <span className="font-bold text-lg text-[#c49d71]">₹{((totalAmount + parseFloat(formData.gst_amount || "0")) - advancePayment).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="netbanking">Net Banking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Booking Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-4 p-4 bg-[#f9f3e8] rounded-lg border border-[#c49d71]">
            <h3 className="font-semibold text-[#006938] text-lg">Additional Information</h3>
            <div>
              <Label htmlFor="special_requests">Special Requests</Label>
              <Textarea
                id="special_requests"
                value={formData.special_requests}
                onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                rows={3}
                placeholder="Any special requirements or requests..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[#c49d71]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#c49d71] text-[#006938] hover:bg-[#f9f3e8]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#006938] hover:bg-[#00552d] text-white"
            >
              {item ? "Update Booking" : "Create Booking & Download Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

