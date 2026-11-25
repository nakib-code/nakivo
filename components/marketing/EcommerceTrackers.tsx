"use client";

import { useEffect, useRef } from "react";

import type { EcommerceItem } from "@/types/marketing";
import { trackViewItem, trackViewItemList } from "@/lib/marketing/tracker";
import { useOptionalMarketing } from "@/providers/MarketingProvider";

export function TrackViewItem({ item }: { item: EcommerceItem }) {
  const marketing = useOptionalMarketing();
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!marketing) return;
    if (firedRef.current === item.item_id) return;

    const eventId = trackViewItem(item);
    if (eventId) {
      firedRef.current = item.item_id;
    }
  }, [item, marketing]);

  return null;
}

export function TrackViewItemList({
  listName,
  items,
}: {
  listName: string;
  items: EcommerceItem[];
}) {
  const marketing = useOptionalMarketing();
  const firedKeyRef = useRef<string | null>(null);

  const key = `${listName}:${items.map((i) => i.item_id).join(",")}`;

  useEffect(() => {
    if (!marketing || items.length === 0) return;
    if (firedKeyRef.current === key) return;

    const eventId = trackViewItemList(listName, items);
    if (eventId) {
      firedKeyRef.current = key;
    }
  }, [key, listName, items, marketing]);

  return null;
}
