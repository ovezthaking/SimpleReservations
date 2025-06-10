import { calculateEndTime } from './App';

// Wyeksportuj funkcję z App.js
// export const calculateEndTime = (startTime, duration) => {
//   const [hours, minutes] = startTime.split(':').map(Number);
//   const durationFloat = parseFloat(duration);
//   const durationHours = Math.floor(durationFloat);
//   const durationMinutes = (durationFloat - durationHours) * 60;
//   
//   const totalMinutes = hours * 60 + minutes + durationHours * 60 + durationMinutes;
//   const endHours = Math.floor(totalMinutes / 60);
//   const endMinutes = totalMinutes % 60;
//   
//   return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
// };

describe('calculateEndTime', () => {
  test('oblicza poprawnie godzinę końcową dla całych godzin', () => {
    expect(calculateEndTime('08:30', '1')).toBe('09:30');
    expect(calculateEndTime('14:15', '3')).toBe('17:15');
    expect(calculateEndTime('23:00', '2')).toBe('01:00');
  });

  test('oblicza poprawnie godzinę końcową dla ułamków godzin', () => {
    expect(calculateEndTime('10:00', '1.5')).toBe('11:30');
    expect(calculateEndTime('09:15', '0.5')).toBe('09:45');
    expect(calculateEndTime('13:30', '2.25')).toBe('15:45');
  });

  test('oblicza poprawnie dla ułamków minut', () => {
    expect(calculateEndTime('10:00', '0.25')).toBe('10:15');
    expect(calculateEndTime('10:00', '0.75')).toBe('10:45');
    expect(calculateEndTime('14:45', '1.25')).toBe('16:00');
  });

  test('obsługuje przejście przez godziny', () => {
    expect(calculateEndTime('23:30', '1')).toBe('00:30');
    expect(calculateEndTime('23:45', '0.5')).toBe('00:15');
  });

  test('obsługuje długie czasy trwania', () => {
    expect(calculateEndTime('08:00', '8')).toBe('16:00');
    expect(calculateEndTime('09:30', '6.5')).toBe('16:00');
  });
});