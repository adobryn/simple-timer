import React, { useState, useEffect } from "react";
import Select from "react-select";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const Timer = () => {
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const [originalTime, setOriginalTime] = useState(60); // Stores original total time for progress calculation

  let timerInterval = null;

  // Request notification permission when the app loads
  useEffect(() => {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  // Generate dropdown options (0-59)
  const generateOptions = (max) =>
    Array.from({ length: max + 1 }, (_, i) => ({
      value: i,
      label: i.toString().padStart(2, "0"),
    }));

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
    setMinutes(1);
    setSeconds(0);
  };

  // Countdown effect
  useEffect(() => {
    if (running && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerInterval);
    }

    if (timeLeft === 0 && running) {
      // ✅ Trigger OS notification with system sound
      if (Notification.permission === "granted") {
        new Notification("⏳ Timer Done!");
      }

      setRunning(false); // Stop automatically
    }

    return () => clearInterval(timerInterval);
  }, [running, timeLeft]);

  // Calculate progress percentage
  const progress = timeLeft !== null ? (timeLeft / originalTime) * 100 : 100;

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
          <Select
            options={generateOptions(10)} // Minutes dropdown (0-10)
            value={{ value: minutes, label: minutes.toString().padStart(2, "0") }}
            onChange={(option) => setMinutes(option.value)}
            isDisabled={running}
            styles={customStyles}
          />
          <span style={styles.colon}>:</span>
          <Select
            options={generateOptions(59)} // Seconds dropdown (0-59)
            value={{ value: seconds, label: seconds.toString().padStart(2, "0") }}
            onChange={(option) => setSeconds(option.value)}
            isDisabled={running}
            styles={customStyles}
          />
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

// Styles for components
const styles = {
  container: {
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
  },
  title: {
    fontSize: "36px",
    marginBottom: "20px",
  },
  progressContainer: {
    width: "150px",
    height: "150px",
    margin: "0 auto 20px",
  },
  pickerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  colon: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
  startButton: {
    padding: "12px 24px",
    fontSize: "18px",
    cursor: "pointer",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    width: "120px",
    textAlign: "center",
  },
  stopButton: {
    padding: "12px 24px",
    fontSize: "18px",
    cursor: "pointer",
    backgroundColor: "#d9534f",
    color: "white",
    border: "none",
    borderRadius: "5px",
    width: "120px",
    textAlign: "center",
  },
};

// Custom styles for react-select dropdowns
const customStyles = {
  control: (base) => ({
    ...base,
    width: "90px",
    fontSize: "18px",
    textAlign: "center",
  }),
};

export default Timer;
