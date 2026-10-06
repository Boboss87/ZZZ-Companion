import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import React from "react";
import { Pressable, View } from "react-native";
import { Heart } from "phosphor-react-native";

import { ELEMENT_COLORS, fonts, radius, spacing, useTheme } from "@/src/theme";
import { Agent } from "@/src/store/types";
import { ResImage } from "@/src/store/resources";
import { daysUntil } from "@/src/store/format";
import { AppText, Badge, haptic } from "./ui";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AgentPortrait({
  agent,
  size,
  onPress,
}: {
  agent: Agent;
  size: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const elementColor = ELEMENT_COLORS[agent.element] ?? colors.brandPrimary;
  const owned = agent.owned;
  const base = owned ? elementColor : colors.surfaceTertiary;
  const du = daysUntil(agent.lastBanner);
  const sinceRerun = du != null ? -du : null;

  return (
    <Pressable
      testID={`agent-tile-${agent.id}`}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => ({
        width: size,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: size,
          height: size * 1.15,
          borderRadius: radius.md,
          overflow: "hidden",
          borderWidth: agent.rank === "S" ? 2 : 1,
          borderColor: owned ? (agent.rank === "S" ? colors.brandPrimary : colors.border) : colors.border,
          opacity: owned ? 1 : 0.45,
        }}
      >
        <ResImage
          kind="portrait"
          value={agent.name}
          style={{ width: "100%", height: "100%" }}
          fallback={
            agent.portrait ? (
              <Image source={{ uri: agent.portrait }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={[base, owned ? "#0A0A0A" : colors.surface]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <AppText
                  style={{ fontFamily: fonts.display, fontSize: size * 0.34, color: owned ? "#0A0A0A" : colors.muted }}
                >
                  {initials(agent.name)}
                </AppText>
              </LinearGradient>
            )
          }
        />

        {/* rank + spec corner */}
        <View style={{ position: "absolute", top: spacing.xs, left: spacing.xs, flexDirection: "row", gap: 3 }}>
          <ResImage kind="rank" value={agent.rank} style={{ width: 18, height: 18, borderRadius: 4 }}
            fallback={<Badge label={agent.rank} bg={agent.rank === "S" ? colors.brandPrimary : colors.surfaceTertiary} fg={agent.rank === "S" ? colors.onBrandPrimary : colors.onSurfaceTertiary} />} />
          <ResImage kind="spec" value={agent.specialization} style={{ width: 18, height: 18, borderRadius: 4 }}
            fallback={<Badge label={agent.specialization.slice(0, 3).toUpperCase()} bg={colors.surfaceInverse} fg={colors.onSurfaceInverse} />} />
        </View>
        <View style={{ position: "absolute", top: spacing.xs, right: spacing.xs, alignItems: "flex-end", gap: 4 }}>
          <ResImage kind="element" value={agent.element} style={{ width: 16, height: 16, borderRadius: 8 }}
            fallback={<View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: elementColor }} />} />
          {agent.wishlist ? <Heart size={16} color={colors.brandSecondary} weight="fill" /> : null}
        </View>

        {/* name scrim */}
        <LinearGradient
          colors={["transparent", "rgba(10,10,10,0.9)"]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 6, paddingTop: 14, paddingBottom: 6 }}
        >
          <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#FFFFFF" }}>
            {agent.name}
          </AppText>
        </LinearGradient>

        {owned ? (
          <View style={{ position: "absolute", bottom: 26, left: spacing.xs }}>
            <Badge label={`M${agent.mindscape}W${agent.hasSignatureEngine ? agent.engineRank : 0}`} bg={colors.surfaceInverse} fg={colors.onSurfaceInverse} />
          </View>
        ) : null}

        {sinceRerun != null ? (
          <View style={{ position: "absolute", bottom: 26, right: spacing.xs }}>
            <Badge label={`${sinceRerun} j`} bg={colors.surfaceInverse} fg={colors.onSurfaceInverse} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
