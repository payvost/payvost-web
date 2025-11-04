"use client";
import React from "react";

export function LastUpdatedTime({ date }: { date: Date }) {
  if (!date) return null;
  // Always render in client, use UTC for consistency
  return <span>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'UTC' })} UTC</span>;
}
