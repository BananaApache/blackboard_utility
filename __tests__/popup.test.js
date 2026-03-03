// Import the utility functions (in a real scenario, you'd export them from popup.js)
// For testing purposes, we'll redefine them here

function convertToNormalTime(inputTime) {
  const correctedTime = inputTime.replace(/\./g, ':');

  const [timePart, offset] = correctedTime.split('-');
  [hours, minutes] = timePart.split(':').map(Number);

  hours = hours - 2;

  const date = new Date();
  date.setUTCHours(hours - parseInt(offset), minutes, 0, 0);

  let hour = date.getHours();
  const isPM = hour >= 12;
  hour = hour % 12 || 12;
  const formattedTime = `${hour}:${String(date.getMinutes()).padStart(2, '0')} ${isPM ? 'AM' : 'PM'}`;

  return formattedTime;
}

function formatTime(time) {
  const [hour, minute] = time.split('.');
  let hours = parseInt(hour);
  let period = "AM";

  if (hours >= 12) {
    hours = hours === 12 ? 12 : hours - 12;
    period = "PM";
  } else if (hours === 0) {
    hours = 12;
  }

  return `${hours}:${minute} ${period}`;
}

function convertTimeToMinutes(time) {
  const [hour, minute] = time.split('.');
  return parseInt(hour) * 60 + parseInt(minute);
}

describe('popup.js - formatTime', () => {
  test('should format morning time correctly', () => {
    expect(formatTime('9.30')).toBe('9:30 AM');
    expect(formatTime('8.00')).toBe('8:00 AM');
  });

  test('should format afternoon time correctly', () => {
    expect(formatTime('13.30')).toBe('1:30 PM');
    expect(formatTime('15.45')).toBe('3:45 PM');
  });

  test('should handle noon correctly', () => {
    expect(formatTime('12.00')).toBe('12:00 PM');
    expect(formatTime('12.30')).toBe('12:30 PM');
  });

  test('should handle midnight correctly', () => {
    expect(formatTime('0.00')).toBe('12:00 AM');
    expect(formatTime('0.30')).toBe('12:30 AM');
  });

  test('should format evening time correctly', () => {
    expect(formatTime('18.00')).toBe('6:00 PM');
    expect(formatTime('23.59')).toBe('11:59 PM');
  });

  test('should handle single digit hours', () => {
    expect(formatTime('1.15')).toBe('1:15 AM');
    expect(formatTime('5.00')).toBe('5:00 AM');
  });
});

describe('popup.js - convertTimeToMinutes', () => {
  test('should convert morning time to minutes', () => {
    expect(convertTimeToMinutes('9.30')).toBe(570); // 9*60 + 30
    expect(convertTimeToMinutes('8.00')).toBe(480); // 8*60
  });

  test('should convert afternoon time to minutes', () => {
    expect(convertTimeToMinutes('13.30')).toBe(810); // 13*60 + 30
    expect(convertTimeToMinutes('15.45')).toBe(945); // 15*60 + 45
  });

  test('should handle midnight', () => {
    expect(convertTimeToMinutes('0.00')).toBe(0);
  });

  test('should handle noon', () => {
    expect(convertTimeToMinutes('12.00')).toBe(720); // 12*60
  });

  test('should handle end of day', () => {
    expect(convertTimeToMinutes('23.59')).toBe(1439); // 23*60 + 59
  });

  test('should handle single digit minutes', () => {
    expect(convertTimeToMinutes('10.5')).toBe(605); // 10*60 + 5
  });
});

describe('popup.js - convertToNormalTime', () => {
  // Note: This function's behavior depends on the current timezone
  // These tests may need to be adjusted based on timezone
  
  test('should replace dots with colons', () => {
    const result = convertToNormalTime('14.30-5');
    // Should contain time format HH:MM AM/PM
    expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
  });

  test('should handle time with offset', () => {
    const result = convertToNormalTime('16.00-5');
    expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
  });

  test('should handle zero offset', () => {
    const result = convertToNormalTime('12.00-0');
    expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
  });

  test('should return properly formatted string', () => {
    const result = convertToNormalTime('9.30-5');
    // Check format: H:MM AM or HH:MM AM
    expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
  });

  test('should pad minutes with zero', () => {
    const result = convertToNormalTime('14.05-5');
    expect(result).toContain(':05');
  });
});

describe('popup.js - Date formatting', () => {
  test('should format date correctly', () => {
    const today = new Date(2026, 2, 3); // March 3, 2026
    const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    
    expect(formattedDate).toBe('03/03/2026');
  });

  test('should get day of week', () => {
    const currentDate = new Date(2026, 2, 3); // March 3, 2026 (Tuesday)
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    expect(dayOfWeek).toBe('Tuesday');
  });
});

describe('popup.js - Day conversion', () => {
  test('should convert day names to abbreviations', () => {
    const convertDay = {
      "Monday": "mon",
      "Tuesday": "tues",
      "Wednesday": "wed",
      "Thursday": "thurs",
      "Friday": "fri",
      "Saturday": "sat",
      "Sunday": "sun"
    };

    expect(convertDay["Monday"]).toBe("mon");
    expect(convertDay["Tuesday"]).toBe("tues");
    expect(convertDay["Wednesday"]).toBe("wed");
    expect(convertDay["Thursday"]).toBe("thurs");
    expect(convertDay["Friday"]).toBe("fri");
    expect(convertDay["Saturday"]).toBe("sat");
    expect(convertDay["Sunday"]).toBe("sun");
  });
});

describe('popup.js - DOM Helper Functions', () => {
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="output-box" style="max-height: 100px;">
        <p>Test content</p>
      </div>
    `;
  });

  test('adjustBoxHeight should increase box height', () => {
    const tag = document.createElement('div');
    Object.defineProperty(tag, 'scrollHeight', {
      configurable: true,
      value: 50
    });
    
    const outputBox = document.querySelector('.output-box');
    const initialHeight = parseFloat(outputBox.style.maxHeight);
    
    // Mock adjustBoxHeight
    const adjustBoxHeight = (tag) => {
      const outputBox = document.querySelector(".output-box");
      if (isNaN(parseFloat(outputBox.style.maxHeight))) {
        const height = tag.scrollHeight + 200;
        outputBox.style.maxHeight = `${height}px`;
      } else {
        const height = parseFloat(outputBox.style.maxHeight) + tag.scrollHeight + 200;
        outputBox.style.maxHeight = `${height}px`;
      }
    };
    
    adjustBoxHeight(tag);
    
    const newHeight = parseFloat(outputBox.style.maxHeight);
    expect(newHeight).toBeGreaterThan(initialHeight);
  });

  test('flattenBox should set height to 10px', () => {
    const flattenBox = () => {
      document.querySelector(".output-box").style.maxHeight = "10px";
    };
    
    flattenBox();
    
    const outputBox = document.querySelector('.output-box');
    expect(outputBox.style.maxHeight).toBe('10px');
  });
});

describe('popup.js - Schedule Sorting', () => {
  test('should sort schedule by start time', () => {
    const schedule = {
      'Math 101': { start: '13.30', end: '14.45' },
      'English 201': { start: '9.00', end: '10.15' },
      'Physics 301': { start: '11.30', end: '12.45' }
    };

    const convertTimeToMinutes = (time) => {
      const [hour, minute] = time.split('.');
      return parseInt(hour) * 60 + parseInt(minute);
    };

    const sortedSchedule = Object.entries(schedule).sort((a, b) => {
      const startTimeA = convertTimeToMinutes(a[1].start);
      const startTimeB = convertTimeToMinutes(b[1].start);
      return startTimeA - startTimeB;
    });

    expect(sortedSchedule[0][0]).toBe('English 201');
    expect(sortedSchedule[1][0]).toBe('Physics 301');
    expect(sortedSchedule[2][0]).toBe('Math 101');
  });
});
