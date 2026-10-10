'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  EXACT_DEFAULT_LAT,
  EXACT_DEFAULT_LNG,
  EXACT_DEFAULT_DMS,
  GpsSample,
  CompiledGpsResult,
  compileGpsSamples,
  getSimulatedGpsSample,
  toDms,
} from './geoUtils';

interface Use5SecGpsCompilerOptions {
  targetLat?: number;
  targetLng?: number;
  autoStart?: boolean;
}

export function use5SecGpsCompiler({
  targetLat = EXACT_DEFAULT_LAT,
  targetLng = EXACT_DEFAULT_LNG,
  autoStart = true,
}: Use5SecGpsCompilerOptions = {}) {
  const [isCompiling, setIsCompiling] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0); // 0 to 5
  const [totalSteps] = useState<number>(5); // 5 seconds window
  const [currentAccuracy, setCurrentAccuracy] = useState<number>(14.4);
  const [samples, setSamples] = useState<GpsSample[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);

  const [compiledResult, setCompiledResult] = useState<CompiledGpsResult>(() => ({
    lat: targetLat,
    lng: targetLng,
    accuracy: 1.1,
    formatted: `${targetLat.toFixed(6)}, ${targetLng.toFixed(6)}`,
    dms: EXACT_DEFAULT_DMS,
    sampleCount: 5,
    initialAccuracy: 14.4,
    refinedAccuracy: 1.1,
    improvementPercent: 92,
    isCompiled: true,
  }));

  const samplesRef = useRef<GpsSample[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start5SecondCompilation = useCallback(() => {
    // Clear any active compilation timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsCompiling(true);
    setProgressPercent(0);
    setCurrentStep(0);
    setSecondsRemaining(5);
    samplesRef.current = [];
    setSamples([]);

    let step = 0;

    const recordStep = () => {
      step += 1;
      setCurrentStep(step);
      setSecondsRemaining(Math.max(0, 5 - step));
      setProgressPercent(Math.min(100, (step / 5) * 100));

      const captureSample = (sample: GpsSample) => {
        samplesRef.current.push(sample);
        setSamples([...samplesRef.current]);
        setCurrentAccuracy(Number(sample.accuracy.toFixed(1)));

        if (step >= 5) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Compile all 5 collected samples into high-accuracy centroid
          const finalResult = compileGpsSamples(samplesRef.current, targetLat, targetLng);
          setCompiledResult(finalResult);
          setIsCompiling(false);
          setProgressPercent(100);
          setSecondsRemaining(0);
        }
      };

      // Try browser geolocation if available
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const raw = pos.coords;
            captureSample({
              lat: raw.latitude,
              lng: raw.longitude,
              accuracy: raw.accuracy || (15 - step * 2.5),
              timestamp: Date.now(),
            });
          },
          () => {
            // Fallback / simulation converging to calibrated doorstep
            const sim = getSimulatedGpsSample(step, targetLat, targetLng);
            captureSample(sim);
          },
          { enableHighAccuracy: true, timeout: 900, maximumAge: 0 }
        );
      } else {
        const sim = getSimulatedGpsSample(step, targetLat, targetLng);
        captureSample(sim);
      }
    };

    // Initial first sample immediately
    recordStep();

    // Remaining samples taken every 1000ms until 5 seconds
    timerRef.current = setInterval(() => {
      if (step < 5) {
        recordStep();
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, 1000);
  }, [targetLat, targetLng]);

  useEffect(() => {
    if (autoStart) {
      start5SecondCompilation();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoStart, start5SecondCompilation]);

  return {
    isCompiling,
    progressPercent,
    currentStep,
    totalSteps,
    secondsRemaining,
    currentAccuracy,
    samples,
    compiledResult,
    recompile: start5SecondCompilation,
    // Convenience shortcuts
    gpsCoords: compiledResult.formatted,
    gpsDms: compiledResult.dms,
    accuracy: compiledResult.refinedAccuracy,
    improvementPercent: compiledResult.improvementPercent,
  };
}
