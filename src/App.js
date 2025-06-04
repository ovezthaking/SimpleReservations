import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, Trash2, Edit, Save, X, Wifi, WifiOff } from 'lucide-react';
import { supabase } from './supabaseClient';

const PrinterScheduler = () => {
  const [reservations, setReservations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    project: '',
    date: '',
    startTime: '',
    duration: '',
    notes: ''
  });

  const isCurrentlyActive = (reservation) => {
    const now = new Date();
    const startTime = new Date(`${reservation.date} ${reservation.startTime}`);
    const endTime = new Date(`${reservation.date} ${calculateEndTime(reservation.startTime, reservation.duration)}`);
    
    return now >= startTime && now <= endTime;
  };



  const formatDuration = (duration) => {
    const durationFloat = parseFloat(duration);
    const hours = Math.floor(durationFloat);
    const minutes = Math.round((durationFloat - hours) * 60);
        
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} h`;
    } else {
      return `${hours} h ${minutes} min`;
    }
  };

  const checkTimeConflict = (newReservation, existingReservations, excludeId = null) => {
    const newStart = new Date(`${newReservation.date} ${newReservation.startTime}`);
    const newEndTime = calculateEndTime(newReservation.startTime, newReservation.duration);
    const newEnd = new Date(`${newReservation.date} ${newEndTime}`);

    return existingReservations.filter(res => {
      if (excludeId && res.id === excludeId) return false; // Wyklucz edytowaną rezerwację
      
      const resStart = new Date(`${res.date} ${res.startTime}`);
      const resEndTime = calculateEndTime(res.startTime, res.duration);
      const resEnd = new Date(`${res.date} ${resEndTime}`);

      // Sprawdź czy są w tym samym dniu i czy czasy się nakładają
      return newReservation.date === res.date && (
        (newStart < resEnd && newEnd > resStart)
      );
    });
  };

  const getConflicts = (reservation) => {
    const conflicts = checkTimeConflict(reservation, reservations, reservation.id);
    
    // Dodaj informację o priorytecie dla każdego konfliktu
    return conflicts.map(conflict => ({
      ...conflict,
      isPriority: new Date(conflict.created_at || '1970-01-01') < new Date(reservation.created_at || '1970-01-01')
    }));
  };

  const hasPriority = (reservation) => {
    const conflicts = getConflicts(reservation);
    return conflicts.length > 0 && conflicts.every(c => !c.isPriority);
  };

  const isSecondary = (reservation) => {
    const conflicts = getConflicts(reservation);
    return conflicts.length > 0 && conflicts.some(c => c.isPriority);
  };





  // Pobierz rezerwacje z bazy danych
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Błąd pobierania danych:', error);
        setConnected(false);
        return;
      }

      // Konwertuj format danych z bazy
      const formattedData = data.map(item => ({
        id: item.id,
        name: item.name,
        project: item.project || '',
        date: item.date,
        startTime: item.start_time,
        duration: item.duration.toString(),
        notes: item.notes || '',
        created_at: item.created_at // Dodaj timestamp utworzenia
      }));

      

      setReservations(formattedData);
      setConnected(true);
    } catch (error) {
      console.error('Błąd połączenia:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Pobierz dane przy starcie
  useEffect(() => {
    fetchReservations();

    // Subskrypcja do zmian w czasie rzeczywistym
    const subscription = supabase
      .channel('reservations_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    if (!formData.name || !formData.date || !formData.startTime || !formData.duration) {
      alert('Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    // Sprawdź kolizje przed zapisaniem
    const conflicts = checkTimeConflict(formData, reservations, editingId);
    if (conflicts.length > 0) {
      const conflictNames = conflicts.map(c => c.name).join(', ');
      if (!window.confirm(`Uwaga! Ta rezerwacja koliduje z rezerwacją użytkownika: ${conflictNames}. Czy chcesz kontynuować?`)) {
        return;
      }
    }

    setLoading(true);

    try {
      if (editingId) {
        // Edycja istniejącej rezerwacji
        const { error } = await supabase
          .from('reservations')
          .update({
            name: formData.name,
            project: formData.project || null,
            date: formData.date,
            start_time: formData.startTime,
            duration: parseFloat(formData.duration),
            notes: formData.notes || null
          })
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Dodanie nowej rezerwacji
        const { error } = await supabase
          .from('reservations')
          .insert({
            name: formData.name,
            project: formData.project || null,
            date: formData.date,
            start_time: formData.startTime,
            duration: parseFloat(formData.duration),
            notes: formData.notes || null
          });

        if (error) throw error;
      }

      // Resetuj formularz
      setFormData({
        name: '',
        project: '',
        date: '',
        startTime: '',
        duration: '',
        notes: ''
      });
      setShowForm(false);
      setConnected(true);
      
      // Wymuś odświeżenie danych
      await fetchReservations();

    } catch (error) {
      console.error('Błąd zapisywania:', error);
      alert('Wystąpił błąd podczas zapisywania. Spróbuj ponownie.');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reservation) => {
    setFormData(reservation);
    setEditingId(reservation.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę rezerwację?')) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setConnected(true);
      
      // Wymuś odświeżenie danych
      await fetchReservations();
    } catch (error) {
      console.error('Błąd usuwania:', error);
      alert('Wystąpił błąd podczas usuwania. Spróbuj ponownie.');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationFloat = parseFloat(duration);
    const durationHours = Math.floor(durationFloat);
    const durationMinutes = (durationFloat - durationHours) * 60;
    
    const totalMinutes = hours * 60 + minutes + durationHours * 60 + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const currentReservation = reservations.find(res => isCurrentlyActive(res));

  const upcomingReservations = reservations.filter(res => {
    const resDate = new Date(`${res.date} ${res.startTime}`);
    return resDate >= new Date();
  });

  const pastReservations = reservations.filter(res => {
    const resDate = new Date(`${res.date} ${res.startTime}`);
    return resDate < new Date();
  });

  if (loading && reservations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie rezerwacji...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-800">
                Rezerwacja Drukarki 3D
              </h1>
              <div className="flex items-center gap-1">
                {connected ? (
                  <Wifi size={20} className="text-green-600" title="Połączony z bazą danych" />
                ) : (
                  <WifiOff size={20} className="text-red-600" title="Brak połączenia z bazą danych" />
                )}
              </div>
            </div>
            <p className="text-gray-600">Prusa i3 MK3 - Sala 309</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Nowa Rezerwacja
          </button>
        </div>

        {/* Formularz rezerwacji */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingId ? 'Edytuj Rezerwację' : 'Nowa Rezerwacja'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      project: '',
                      date: '',
                      startTime: '',
                      duration: '',
                      notes: ''
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Imię i nazwisko *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Projekt</label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => setFormData({...formData, project: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nazwa projektu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Data *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    min={getTodayDate()}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Godzina rozpoczęcia *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Czas trwania *</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Wybierz czas</option>
                    <option value="0.25">15 minut</option>
                    <option value="0.5">30 minut</option>
                    <option value="0.75">45 minut</option>
                    <option value="1">1 godzina</option>
                    <option value="1.25">1 godzina 15 minut</option>
                    <option value="1.5">1 godzina 30 minut</option>
                    <option value="1.75">1 godzina 45 minut</option>
                    <option value="2">2 godziny</option>
                    <option value="2.25">2 godziny 15 minut</option>
                    <option value="2.5">2 godziny 30 minut</option>
                    <option value="2.75">2 godziny 45 minut</option>
                    <option value="3">3 godziny</option>
                    <option value="3.25">3 godziny 15 minut</option>
                    <option value="3.5">3 godziny 30 minut</option>
                    <option value="3.75">3 godziny 45 minut</option>
                    <option value="4">4 godziny</option>
                    <option value="4.25">4 godziny 15 minut</option>
                    <option value="4.5">4 godziny 30 minut</option>
                    <option value="4.75">4 godziny 45 minut</option>
                    <option value="5">5 godzin</option>
                    <option value="5.25">5 godzin 15 minut</option>
                    <option value="5.5">5 godzin 30 minut</option>
                    <option value="5.75">5 godzin 45 minut</option>
                    <option value="6">6 godzin</option>
                    <option value="6.25">6 godzin 15 minut</option>
                    <option value="6.5">6 godzin 30 minut</option>
                    <option value="6.75">6 godzin 45 minut</option>
                    <option value="7">7 godzin</option>
                    <option value="7.25">7 godzin 15 minut</option>
                    <option value="7.5">7 godzin 30 minut</option>
                    <option value="7.75">7 godzin 45 minut</option>
                    <option value="8">8 godzin</option>
                    <option value="8.25">8 godzin 15 minut</option>
                    <option value="8.5">8 godzin 30 minut</option>
                    <option value="8.75">8 godzin 45 minut</option>
                    <option value="9">9 godzin</option>
                    <option value="9.25">9 godzin 15 minut</option>
                    <option value="9.5">9 godzin 30 minut</option>
                    <option value="9.75">9 godzin 45 minut</option>
                    <option value="10">10 godzin</option>
                    <option value="10.25">10 godzin 15 minut</option>
                    <option value="10.5">10 godzin 30 minut</option>
                    <option value="10.75">10 godzin 45 minut</option>
                    <option value="11">11 godzin</option>
                    <option value="11.25">11 godzin 15 minut</option>
                    <option value="11.5">11 godzin 30 minut</option>
                    <option value="11.75">11 godzin 45 minut</option>
                    <option value="12">12 godzin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Uwagi</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Materiał, ustawienia, dodatkowe informacje..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save size={16} />
                    )}
                    {editingId ? 'Zapisz zmiany' : 'Dodaj rezerwację'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({
                        name: '',
                        project: '',
                        date: '',
                        startTime: '',
                        duration: '',
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nadchodzące rezerwacje */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-green-700">Nadchodzące Rezerwacje</h2>
        {upcomingReservations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Brak nadchodzących rezerwacji</p>
        ) : (
          <div className="space-y-4">
            {upcomingReservations.map((reservation) => (
              <div key={reservation.id} className={`border rounded-lg p-4 ${
                isSecondary(reservation) 
                  ? 'border-orange-300 bg-orange-50' 
                  : getConflicts(reservation).length > 0 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-green-200 bg-green-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-600" />
                        <span className="font-semibold">{reservation.name}</span>
                      </div>
                      {reservation.project && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {reservation.project}
                        </span>
                      )}
                      {hasPriority(reservation) && (
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded flex items-center gap-1">
                          ⚠️ Konflikt - Priorytet
                        </span>
                      )}
                      {isSecondary(reservation) && (
                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded flex items-center gap-1">
                          ⚠️ Konflikt - Drugorzędna
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(reservation.date).toLocaleDateString('pl-PL')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>
                          {reservation.startTime} - {calculateEndTime(reservation.startTime, reservation.duration)}
                          {' '}({formatDuration(reservation.duration)})
                        </span>
                      </div>
                    </div>
                    
                    {getConflicts(reservation).length > 0 && (
                      <div className={`text-sm mb-2 ${isSecondary(reservation) ? 'text-orange-600' : 'text-red-600'}`}>
                        {hasPriority(reservation) && (
                          <div>
                            <strong>🏆 Ma priorytet - konflikt z:</strong> {getConflicts(reservation).map(c => c.name).join(', ')}
                            <div className="text-xs mt-1">Ta rezerwacja została dodana pierwsza</div>
                          </div>
                        )}
                        {isSecondary(reservation) && (
                          <div>
                            <strong>⏰ Drugorzędna - konflikt z:</strong> {getConflicts(reservation).filter(c => c.isPriority).map(c => c.name).join(', ')}
                            <div className="text-xs mt-1">Ta rezerwacja została dodana później</div>
                          </div>
                        )}
                      </div>
                    )}
                    {reservation.notes && (
                      <p className="text-sm text-gray-600 italic">{reservation.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(reservation)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-800 disabled:text-blue-400 p-1"
                      title="Edytuj"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(reservation.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 disabled:text-red-400 p-1"
                      title="Usuń"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Obecna rezerwacja */}
      {currentReservation && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
            🔥 Obecna rezerwacja
          </h2>
          <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-600" />
                    <span className="font-semibold text-lg">{currentReservation.name}</span>
                  </div>
                  {currentReservation.project && (
                    <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded">
                      {currentReservation.project}
                    </span>
                  )}
                  <span className="text-sm bg-green-200 text-green-800 px-2 py-1 rounded font-semibold">
                    ✅ W TRAKCIE
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(currentReservation.date).toLocaleDateString('pl-PL')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>
                      {currentReservation.startTime} - {calculateEndTime(currentReservation.startTime, currentReservation.duration)}
                      {' '}({formatDuration(currentReservation.duration)})
                    </span>
                  </div>
                </div>

                {currentReservation.notes && (
                  <p className="text-sm text-gray-600 italic">{currentReservation.notes}</p>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(currentReservation)}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 disabled:text-blue-400 p-1"
                  title="Edytuj"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(currentReservation.id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-800 disabled:text-red-400 p-1"
                  title="Usuń"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historia rezerwacji */}
      {pastReservations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-600">Historia Rezerwacji</h2>
          <div className="space-y-3">
            {pastReservations.map((reservation) => (
              <div key={reservation.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50 opacity-75">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-1">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-500" />
                        <span className="font-medium text-gray-700">{reservation.name}</span>
                      </div>
                      {reservation.project && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          {reservation.project}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{new Date(reservation.date).toLocaleDateString('pl-PL')}</span>
                      <span>
                        {reservation.startTime} - {calculateEndTime(reservation.startTime, reservation.duration)}
                        {' '}({formatDuration(reservation.duration)})
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(reservation.id)}
                    disabled={loading}
                    className="text-gray-400 hover:text-red-600 disabled:text-gray-300 p-1"
                    title="Usuń z historii"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!connected && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <WifiOff size={16} />
            <span className="text-sm">Brak połączenia z bazą danych</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrinterScheduler;