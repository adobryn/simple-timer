import React, { useState, useEffect, useRef, useMemo } from "react";
import Select from "react-select";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

// Move options generation outside component to prevent recreation on every render
const generateOptions = (max) =>
    Array.from({ length: max + 1 }, (_, i) => ({
      value: i,
      label: i.toString().padStart(2, "0"),
    }));

// Memoize options to prevent unnecessary recalculations
const minuteOptions = generateOptions(10); // Minutes dropdown (0-10)
const secondOptions = generateOptions(59); // Seconds dropdown (0-59)

const Timer = () => {
  // Load saved timer settings from localStorage on initial render
  const getSavedTimerState = () => {
    try {
      const savedState = localStorage.getItem("timerSettings");
      if (savedState) {
        const { minutes, seconds } = JSON.parse(savedState);
        return { minutes, seconds };
      }
    } catch (error) {
      console.error("Error loading saved timer state:", error);
    }
    // Default values if no saved state or error occurs
    return { minutes: 1, seconds: 0 };
  };

  const { minutes: savedMinutes, seconds: savedSeconds } = getSavedTimerState();
  const [minutes, setMinutes] = useState(savedMinutes);
  const [seconds, setSeconds] = useState(savedSeconds);
  const [timeLeft, setTimeLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const [originalTime, setOriginalTime] = useState(60);
  const [isMobile, setIsMobile] = useState(false);

  // Audio ref for sound notification
  const audioRef = useRef(null);
  // Use useRef for interval tracking instead of variable
  const timerIntervalRef = useRef(null);

  // Detect if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Request notification permission when the app loads
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Save timer settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("timerSettings", JSON.stringify({ minutes, seconds }));
    } catch (error) {
      console.error("Error saving timer state:", error);
    }
  }, [minutes, seconds]);

  // Start the timer
  const startTimer = () => {
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds > 0) {
      setTimeLeft(totalSeconds);
      setOriginalTime(totalSeconds); // Store original time for progress calculation
      setRunning(true);
    }
  };

  // Stop and reset the timer
  const stopTimer = () => {
    setRunning(false);
    setTimeLeft(null);

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Function to notify the user when timer completes
  const notifyUser = () => {
    // Use appropriate notification methods based on device type

    // Web Notification (works best on desktop)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏳ Timer Done!");
    }

    // Vibration API (works on mobile devices that support it)
    if ("vibrate" in navigator && isMobile) {
      // Simple 300ms vibration as requested
      navigator.vibrate(300);
    }

    // Audio alert (works on most devices)
    if (audioRef.current) {
      // Set volume to an appropriate level
      audioRef.current.volume = 0.7;
      audioRef.current.play().catch(e => {
        console.warn("Could not play audio alert:", e);
      });
    }
  };

  // Countdown effect with proper cleanup
  useEffect(() => {
    if (running && timeLeft > 0) {
      // Clear any existing interval first to prevent multiple intervals
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && running) {
      // Timer completed
      notifyUser();
      setRunning(false);
    }

    // Cleanup function that properly clears the interval
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [running, timeLeft, isMobile]);

  // Calculate progress percentage
  const progress = timeLeft !== null ? (timeLeft / originalTime) * 100 : 100;

  // Memoize Select components to prevent unnecessary re-renders
  const minuteSelect = useMemo(() => (
      <Select
          options={minuteOptions}
          value={{ value: minutes, label: minutes.toString().padStart(2, "0") }}
          onChange={(option) => setMinutes(option.value)}
          isDisabled={running}
          styles={customStyles}
      />
  ), [minutes, running]);

  const secondSelect = useMemo(() => (
      <Select
          options={secondOptions}
          value={{ value: seconds, label: seconds.toString().padStart(2, "0") }}
          onChange={(option) => setSeconds(option.value)}
          isDisabled={running}
          styles={customStyles}
      />
  ), [seconds, running]);

  return (
      <div style={styles.pageContainer}>
        <div style={styles.container}>
          {/* Hidden audio element for sound notification */}
          <audio ref={audioRef}>
            <source src="https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3" type="audio/mpeg" />
            <source src="https://assets.mixkit.co/sfx/preview/mixkit-alert-quick-chime-766.mp3" type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>

          <h1 style={styles.title}>⏳ Simple Timer</h1>

          {/* Show countdown when running, otherwise show dropdowns */}
          {running ? (
              <div style={styles.progressContainer}>
                <CircularProgressbar
                    value={progress}
                    text={`${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(
                        timeLeft % 60
                    ).padStart(2, "0")}`}
                    styles={buildStyles({
                      textSize: "20px",
                      pathColor: "#4CAF50", // Green progress color
                      textColor: "#333",
                      trailColor: "#ddd",
                    })}
                />
              </div>
          ) : (
              <div style={styles.pickerContainer}>
                {minuteSelect}
                <span style={styles.colon}>:</span>
                {secondSelect}
              </div>
          )}

          <div style={styles.buttonContainer}>
            <button
                onClick={startTimer}
                disabled={running || (minutes === 0 && seconds === 0)}
                style={styles.startButton}
            >
              {running ? "Running..." : "Start"}
            </button>
            <button onClick={stopTimer} disabled={!running} style={styles.stopButton}>
              Stop
            </button>
          </div>

          {isMobile && (
              <p style={styles.mobileInfo}>
                {Notification.permission !== "granted" ?
                    "Enable notifications for alerts when timer ends" :
                    "Your device will vibrate when the timer ends"}
              </p>
          )}
        </div>
      </div>
  );
};

// Styles for components with improved mobile responsiveness and centering
const styles = {
  pageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",  // Full screen height
    width: "100vw",   // Full screen width
    margin: "0",
    padding: "0",
    backgroundColor: "#f8f9fa", // Optional light background
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    maxWidth: "400px",  // Prevents stretching on larger screens
    width: "min(90%, 400px)", // Ensures responsiveness
    minHeight: "200px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
    backgroundColor: "white",
    margin: "0 auto",
  },
  title: {
    fontSize: "clamp(24px, 5vw, 36px)", // Responsive font size
    marginBottom: "20px",
    textAlign: "center",
    width: "100%",
  },
  progressContainer: {
    width: "min(150px, 80vw)",
    height: "min(150px, 80vw)",
    margin: "0 auto 20px",
  },
  pickerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap", // Allow wrapping on very small screens
    width: "100%",
  },
  colon: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap", // Allow buttons to wrap on small screens
    width: "100%",
  },
  startButton: {
    padding: "12px 24px",
    fontSize: "clamp(16px, 4vw, 18px)", // Responsive font size
    cursor: "pointer",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    width: "min(120px, 45%)", // Responsive width
    textAlign: "center",
    margin: "5px", // Add margin for when buttons wrap
  },
  stopButton: {
    padding: "12px 24px",
    fontSize: "clamp(16px, 4vw, 18px)", // Responsive font size
    cursor: "pointer",
    backgroundColor: "#d9534f",
    color: "white",
    border: "none",
    borderRadius: "5px",
    width: "min(120px, 45%)", // Responsive width
    textAlign: "center",
    margin: "5px", // Add margin for when buttons wrap
  },
  mobileInfo: {
    fontSize: "14px",
    color: "#666",
    marginTop: "20px",
    textAlign: "center",
    width: "100%",
  }
};

// Custom styles for react-select dropdowns
const customStyles = {
  control: (base) => ({
    ...base,
    width: "min(90px, 40vw)", // Responsive width
    fontSize: "clamp(14px, 3vw, 18px)", // Responsive font size
    textAlign: "center",
  }),
  menu: (base) => ({
    ...base,
    width: "min(90px, 40vw)", // Match control width
  }),
};

export default Timer;