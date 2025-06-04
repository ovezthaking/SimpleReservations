import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PrinterScheduler from './App';
import { supabase } from './supabaseClient';

// Mock Supabase
jest.mock('./supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn()
  }
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  User: () => <div data-testid="user-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Save: () => <div data-testid="save-icon" />,
  X: () => <div data-testid="x-icon" />,
  Wifi: () => <div data-testid="wifi-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />
}));

describe('PrinterScheduler Component', () => {
  const mockReservations = [
    {
      id: 1,
      name: 'Jan Kowalski',
      project: 'Projekt A',
      date: '2025-06-05',
      start_time: '10:00',
      duration: 2,
      notes: 'Test notes',
      created_at: '2025-06-04T10:00:00Z'
    },
    {
      id: 2,
      name: 'Anna Nowak',
      project: 'Projekt B',
      date: '2025-06-06',
      start_time: '14:00',
      duration: 1.5,
      notes: null,
      created_at: '2025-06-04T11:00:00Z'
    }
  ];

  const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis()
  };

  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default Supabase mocks
    supabase.from.mockReturnValue(mockSupabaseChain);
    supabase.channel.mockReturnValue(mockChannel);
    
    // Mock successful data fetch
    mockSupabaseChain.select.mockResolvedValue({
      data: mockReservations,
      error: null
    });

    // Mock Date to be predictable
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-04T09:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    test('renders main title and subtitle', async () => {
      await act(async () => {
        render(<PrinterScheduler />);
      });

      expect(screen.getByText('Rezerwacja Drukarki 3D')).toBeInTheDocument();
      expect(screen.getByText('Prusa i3 MK3 - Sala 309')).toBeInTheDocument();
    });

    test('renders "Nowa Rezerwacja" button', async () => {
      await act(async () => {
        render(<PrinterScheduler />);
      });

      expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument();
    });

    test('shows loading state initially', () => {
      render(<PrinterScheduler />);
      expect(screen.getByText('Ładowanie rezerwacji...')).toBeInTheDocument();
    });

    test('shows connection status icon', async () => {
      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    test('fetches reservations on component mount', async () => {
      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('reservations');
        expect(mockSupabaseChain.select).toHaveBeenCalledWith('*');
        expect(mockSupabaseChain.order).toHaveBeenCalledWith('date', { ascending: true });
      });
    });

    test('displays reservations after loading', async () => {
      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
        expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
      });
    });

    test('handles fetch error gracefully', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: null,
        error: { message: 'Network error' }
      });

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Reservation Form', () => {
    test('opens form when "Nowa Rezerwacja" is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Nowa Rezerwacja'));

      expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument();
      expect(screen.getByLabelText('Imię i nazwisko *')).toBeInTheDocument();
    });

    test('closes form when X button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Nowa Rezerwacja'));
      await user.click(screen.getByTestId('x-icon'));

      expect(screen.queryByLabelText('Imię i nazwisko *')).not.toBeInTheDocument();
    });

    test('validates required fields', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Nowa Rezerwacja'));
      await user.click(screen.getByText('Dodaj rezerwację'));

      expect(alertSpy).toHaveBeenCalledWith('Proszę wypełnić wszystkie wymagane pola');
      
      alertSpy.mockRestore();
    });

    test('submits form with valid data', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      mockSupabaseChain.insert.mockResolvedValue({ error: null });

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Nowa Rezerwacja'));

      // Fill form
      await user.type(screen.getByLabelText('Imię i nazwisko *'), 'Test User');
      await user.type(screen.getByLabelText('Projekt'), 'Test Project');
      await user.type(screen.getByLabelText('Data *'), '2025-06-10');
      await user.type(screen.getByLabelText('Godzina rozpoczęcia *'), '10:00');
      await user.selectOptions(screen.getByLabelText('Czas trwania *'), '2');

      await user.click(screen.getByText('Dodaj rezerwację'));

      await waitFor(() => {
        expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
          name: 'Test User',
          project: 'Test Project',
          date: '2025-06-10',
          start_time: '10:00',
          duration: 2,
          notes: null
        });
      });
    });
  });

  describe('Duration Formatting', () => {
    test('formats duration correctly', async () => {
      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        // Should show "2 h" for 2-hour duration
        expect(screen.getByText(/2 h/)).toBeInTheDocument();
        // Should show "1 h 30 min" for 1.5-hour duration
        expect(screen.getByText(/1 h 30 min/)).toBeInTheDocument();
      });
    });
  });

  describe('Time Calculations', () => {
    test('calculates end time correctly', async () => {
      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        // 10:00 + 2h = 12:00
        expect(screen.getByText(/10:00 - 12:00/)).toBeInTheDocument();
        // 14:00 + 1.5h = 15:30
        expect(screen.getByText(/14:00 - 15:30/)).toBeInTheDocument();
      });
    });
  });

  describe('Conflict Detection', () => {
    test('detects time conflicts', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock window.confirm to return false (cancel)
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Nowa Rezerwacja'));

      // Create conflicting reservation
      await user.type(screen.getByLabelText('Imię i nazwisko *'), 'Conflict User');
      await user.type(screen.getByLabelText('Data *'), '2025-06-05');
      await user.type(screen.getByLabelText('Godzina rozpoczęcia *'), '11:00');
      await user.selectOptions(screen.getByLabelText('Czas trwania *'), '2');

      await user.click(screen.getByText('Dodaj rezerwację'));

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('koliduje z rezerwacją użytkownika: Jan Kowalski')
      );

      confirmSpy.mockRestore();
    });
  });

  describe('Edit Functionality', () => {
    test('opens edit form with pre-filled data', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByTestId('edit-icon');
      await user.click(editButtons[0]);

      expect(screen.getByText('Edytuj Rezerwację')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jan Kowalski')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Projekt A')).toBeInTheDocument();
    });
  });

  describe('Delete Functionality', () => {
    test('deletes reservation after confirmation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock window.confirm to return true (confirm)
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      mockSupabaseChain.delete.mockResolvedValue({ error: null });

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByTestId('trash-icon');
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith('Czy na pewno chcesz usunąć tę rezerwację?');
      
      await waitFor(() => {
        expect(mockSupabaseChain.delete).toHaveBeenCalled();
        expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 1);
      });

      confirmSpy.mockRestore();
    });

    test('cancels delete when user clicks cancel', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      // Mock window.confirm to return false (cancel)
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByTestId('trash-icon');
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockSupabaseChain.delete).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Real-time Subscriptions', () => {
    test('sets up real-time subscription', async () => {
      await act(async () => {
        render(<PrinterScheduler />);
      });

      expect(supabase.channel).toHaveBeenCalledWith('reservations_channel');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe('Current Reservation Detection', () => {
    test('identifies currently active reservation', async () => {
      // Set current time to be within a reservation period
      jest.setSystemTime(new Date('2025-06-05T10:30:00Z'));

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('🔥 Obecna rezerwacja')).toBeInTheDocument();
        expect(screen.getByText('✅ W TRAKCIE')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('renders mobile-friendly layout', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        const container = screen.getByText('Rezerwacja Drukarki 3D').closest('div');
        expect(container).toHaveClass('max-w-6xl', 'mx-auto', 'p-6');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      mockSupabaseChain.select.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
      });
    });

    test('shows error notification for failed operations', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      mockSupabaseChain.insert.mockResolvedValue({ 
        error: { message: 'Database error' }
      });

      await act(async () => {
        render(<PrinterScheduler />);
      });

      await waitFor(() => {
        expect(screen.getByText('Nowa Rezerwacja')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Nowa Rezerwacja'));

      // Fill and submit form
      await user.type(screen.getByLabelText('Imię i nazwisko *'), 'Test User');
      await user.type(screen.getByLabelText('Data *'), '2025-06-10');
      await user.type(screen.getByLabelText('Godzina rozpoczęcia *'), '10:00');
      await user.selectOptions(screen.getByLabelText('Czas trwania *'), '1');

      await user.click(screen.getByText('Dodaj rezerwację'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Wystąpił błąd podczas zapisywania. Spróbuj ponownie.');
      });

      alertSpy.mockRestore();
    });
  });
});