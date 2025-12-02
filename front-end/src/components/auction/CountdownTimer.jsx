import { useState, useEffect, memo } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

// Countdown Timer Component - memoized for performance
const CountdownTimer = memo(function CountdownTimer({ endDate, onExpired }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        if (onExpired) onExpired();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        expired: false
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endDate, onExpired]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-5 h-5" />
        <span className="font-semibold">Auction Ended</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Clock className="w-5 h-5 text-muted-foreground" />
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <div className="bg-muted px-3 py-1 rounded-md text-center">
            <div className="text-lg font-bold text-foreground">{timeLeft.days}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
        )}
        <div className="bg-muted px-3 py-1 rounded-md text-center">
          <div className="text-lg font-bold text-foreground">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">hrs</div>
        </div>
        <div className="bg-muted px-3 py-1 rounded-md text-center">
          <div className="text-lg font-bold text-foreground">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">min</div>
        </div>
        <div className="bg-muted px-3 py-1 rounded-md text-center">
          <div className="text-lg font-bold text-foreground">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-muted-foreground">sec</div>
        </div>
      </div>
    </div>
  );
});

export default CountdownTimer;
