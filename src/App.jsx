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

  // Use useRef for interval tracking instead of variable
  const timerIntervalRef = useRef(null);

  // Request notification permission when the app loads
  useEffect(() => {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
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
      if (Notification.permission === "granted") {
        new Notification("⏳ Timer Done!");
      }
      setRunning(false);
    }

    // Cleanup function that properly clears the interval
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [running, timeLeft]);

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
      <div style={styles.container}>
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
      </div>
  );
};

// Styles for components with improved mobile responsiveness
const styles = {
  container: {
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    maxWidth: "100%",
    margin: "0 auto",
  },
  title: {
    fontSize: "clamp(24px, 5vw, 36px)", // Responsive font size
    marginBottom: "20px",
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
  },
  colon: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap", // Allow buttons to wrap on small screens
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