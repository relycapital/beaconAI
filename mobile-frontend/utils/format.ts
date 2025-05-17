/**
 * Formats RSSI value to a human-readable distance label
 */
export function formatDistanceToBrand(rssi: number): string {
  if (rssi > -60) {
    return 'Near';
  } else if (rssi > -75) {
    return 'Medium';
  } else {
    return 'Far';
  }
}

/**
 * Formats a timestamp as a relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  } else {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  }
}