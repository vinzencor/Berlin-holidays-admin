import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RoomTypeWithBookings, Booking, RoomType } from '@/types/room';
import { useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

export const useRooms = () => {
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading, error } = useQuery({
    queryKey: ['rooms'],
    queryFn: async (): Promise<RoomTypeWithBookings[]> => {
      const { data: roomTypesData, error: roomTypesError } = await supabase
        .from('room_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (roomTypesError) throw roomTypesError;

      const today = new Date().toISOString().split('T')[0];
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('check_out_date', today)
        .in('status', ['confirmed', 'checked-in', 'pending']);

      if (bookingsError) throw bookingsError;

      const roomTypesWithBookings: RoomTypeWithBookings[] = (roomTypesData || []).map((roomType) => {
        const activeBookings = (bookingsData || []).filter(
          (booking) => booking.room_id === roomType.id
        );

        const booked_count = activeBookings.reduce((sum, booking) => {
          return sum + (booking.number_of_rooms || 0);
        }, 0);

        const available_count = roomType.total_rooms - booked_count;

        console.log(`Room Type: ${roomType.name}`, {
          total_rooms: roomType.total_rooms,
          active_bookings: activeBookings.length,
          booked_count,
          available_count,
          bookings: activeBookings
        });

        return {
          ...roomType,
          active_bookings: activeBookings,
          booked_count,
          available_count,
        };
      });

      console.log('All Bookings from DB:', bookingsData);
      console.log('Room Types with Bookings:', roomTypesWithBookings);

      return roomTypesWithBookings;
    },
  });

  useEffect(() => {
    const roomsChannel = supabase
      .channel('room-types-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_types' }, () => {
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
    };
  }, [queryClient]);

  return { rooms, isLoading, error };
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('bookings').insert([booking]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Booking created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create booking: ${error.message}`);
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Booking> & { id: string }) => {
      const { data, error } = await supabase.from('bookings').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Booking updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update booking: ${error.message}`);
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RoomType> & { id: string }) => {
      const { data, error } = await supabase.from('room_types').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update room type: ${error.message}`);
    },
  });
};
