import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ImageStyle, Platform, StyleProp } from "react-native";

import { useStore } from "./AppStore";

export type ResKind = "portrait" | "rank" | "element" | "spec";

// lowercase, strip accents, non-alphanumerics -> "_"
export function normalizeName(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function resourceFilename(kind: ResKind, value: string): string {
  const n = normalizeName(value);
  if (!n) return "";
  if (kind === "rank") return `rank_${n}.webp`;
  return `${n}.webp`;
}

interface ResourcesCtx {
  resolve: (kind: ResKind, value: string) => string | null;
  folder: string;
  isRemote: boolean;
  isAndroid: boolean;
  ready: boolean;
  count: number;
  pickFolder: () => Promise<void>;
  setRemote: (url: string) => void;
  clearFolder: () => void;
  rescan: () => void;
}

const Ctx = createContext<ResourcesCtx | null>(null);

export function ResourcesProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const folder = store.state.settings.resourceFolderUri || "";
  const isRemote = /^https?:\/\//i.test(folder);
  const isAndroid = Platform.OS === "android";
  const [map, setMap] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  const scan = useCallback(async () => {
    setReady(false);
    if (!folder || isRemote || !isAndroid) {
      setMap({});
      setReady(true);
      return;
    }
    try {
      const files: string[] = await FileSystem.StorageAccessFramework.readDirectoryAsync(folder);
      const m: Record<string, string> = {};
      files.forEach((uri) => {
        const decoded = decodeURIComponent(uri);
        const base = (decoded.split("/").pop() || decoded).toLowerCase();
        m[base] = uri;
      });
      setMap(m);
    } catch {
      setMap({});
    } finally {
      setReady(true);
    }
  }, [folder, isRemote, isAndroid]);

  useEffect(() => {
    scan();
  }, [scan]);

  const resolve = useCallback(
    (kind: ResKind, value: string): string | null => {
      const file = resourceFilename(kind, value);
      if (!file || !folder) return null;
      if (isRemote) return `${folder.replace(/\/+$/, "")}/${file}`;
      return map[file.toLowerCase()] ?? null;
    },
    [folder, isRemote, map],
  );

  const pickFolder = useCallback(async () => {
    if (!isAndroid) return;
    const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (perm.granted) store.setSettings({ resourceFolderUri: perm.directoryUri });
  }, [isAndroid, store]);

  const value = useMemo<ResourcesCtx>(
    () => ({
      resolve,
      folder,
      isRemote,
      isAndroid,
      ready,
      count: Object.keys(map).length,
      pickFolder,
      setRemote: (url: string) => store.setSettings({ resourceFolderUri: url.trim() }),
      clearFolder: () => store.setSettings({ resourceFolderUri: "" }),
      rescan: scan,
    }),
    [resolve, folder, isRemote, isAndroid, ready, map, pickFolder, scan, store],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useResources(): ResourcesCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useResources must be used within ResourcesProvider");
  return c;
}

// Renders a resource image when available, otherwise the provided fallback.
export function ResImage({
  kind,
  value,
  style,
  fallback = null,
}: {
  kind: ResKind;
  value: string;
  style?: StyleProp<ImageStyle>;
  fallback?: React.ReactNode;
}) {
  const { resolve } = useResources();
  const uri = resolve(kind, value);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  if (!uri || failed) return <>{fallback}</>;
  return <Image source={{ uri }} style={style} contentFit="cover" onError={() => setFailed(true)} />;
}
