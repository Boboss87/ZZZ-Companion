import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { AppState } from "./types";

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export async function exportBackup(state: AppState): Promise<{ ok: boolean; message: string }> {
  const json = JSON.stringify(state, null, 2);
  const filename = `zzz-companion-backup-${timestamp()}.json`;

  if (Platform.OS === "web") {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { ok: true, message: "Sauvegarde téléchargée." };
    } catch (e) {
      return { ok: false, message: "Échec de l'export sur le web." };
    }
  }

  try {
    const uri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/json",
        dialogTitle: "Sauvegarder ZZZ Companion",
        UTI: "public.json",
      });
      return { ok: true, message: "Sauvegarde exportée." };
    }
    return { ok: true, message: `Fichier créé : ${filename}` };
  } catch (e) {
    return { ok: false, message: "Échec de l'export." };
  }
}

function isValidState(obj: any): obj is AppState {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.version === "number" &&
    Array.isArray(obj.agents) &&
    Array.isArray(obj.objectives) &&
    Array.isArray(obj.presets) &&
    obj.settings &&
    obj.commonStock
  );
}

export async function importBackup(): Promise<{
  ok: boolean;
  state?: AppState;
  message: string;
}> {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "*/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets || res.assets.length === 0) {
      return { ok: false, message: "Import annulé." };
    }
    const asset = res.assets[0];
    let content: string;
    if (Platform.OS === "web") {
      content = await fetch(asset.uri).then((r) => r.text());
    } else {
      content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
    const parsed = JSON.parse(content);
    if (!isValidState(parsed)) {
      return { ok: false, message: "Fichier de sauvegarde invalide." };
    }
    return { ok: true, state: parsed, message: "Sauvegarde restaurée." };
  } catch (e) {
    return { ok: false, message: "Échec de l'import du fichier." };
  }
}
