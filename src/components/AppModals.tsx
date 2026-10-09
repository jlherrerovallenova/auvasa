import React from 'react';
import { StopArrivalsModal } from './StopArrivalsModal.tsx';
import { OnboardSetupModal } from './onboard/OnboardSetupModal.tsx';
import { OnboardDashboardModal } from './onboard/OnboardDashboardModal.tsx';
import { OnboardMiniBar } from './onboard/OnboardMiniBar.tsx';
import { WatchShareModal } from './watch/WatchShareModal.tsx';
import type { BusStop, BusRoute, StopArrival, RouteStop } from '../types/bus.ts';
import type { OnboardTrip, OnboardMetrics } from '../types/onboard.ts';
import type { ActiveTab } from './Header.tsx';

export interface AppModalsProps {
  activeTab: ActiveTab;
  selectedStop: BusStop | null;
  onCloseStopModal: () => void;
  isFavoriteStop: (code: string) => boolean;
  onToggleFavoriteStop: (code: string) => void;
  onViewStopOnMap: (stop: BusStop) => void;
  onSetAlarm: (stop: BusStop) => void;
  onStartOnboardFromArrival: (stop: BusStop, arrival: StopArrival) => void;
  onLocateBus: (arrival: StopArrival) => void;
  userLat: number | null;
  userLon: number | null;
  onRequestLocation: () => void;
  onboardSetup: {
    route: BusRoute;
    originStop: BusStop;
    vehicleId?: string | null;
  } | null;
  onCloseOnboardSetup: () => void;
  onStartTrip: (params: {
    route: BusRoute;
    directionKey: string;
    originStop: RouteStop | BusStop;
    destinationStop: RouteStop | null;
    vehicleId?: string | null;
  }) => void;
  onboardTrip: OnboardTrip | null;
  onboardMetrics: OnboardMetrics;
  isOnboardDashboardOpen: boolean;
  onCloseOnboardDashboard: () => void;
  onEndTrip: () => void;
  isBellActive: boolean;
  onRingBell: () => void;
  onAdvanceStop: () => void;
  onRewindStop: () => void;
  onToggleOnboardMute: () => void;
  onSetOnboardDestinationStop: (stop: RouteStop) => void;
  onOpenOnboardDashboard: () => void;
  isWatchShareModalOpen: boolean;
  onCloseWatchShareModal: () => void;
  onLaunchWatchView: () => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  activeTab,
  selectedStop,
  onCloseStopModal,
  isFavoriteStop,
  onToggleFavoriteStop,
  onViewStopOnMap,
  onSetAlarm,
  onStartOnboardFromArrival,
  onLocateBus,
  userLat,
  userLon,
  onRequestLocation,
  onboardSetup,
  onCloseOnboardSetup,
  onStartTrip,
  onboardTrip,
  onboardMetrics,
  isOnboardDashboardOpen,
  onCloseOnboardDashboard,
  onEndTrip,
  isBellActive,
  onRingBell,
  onAdvanceStop,
  onRewindStop,
  onToggleOnboardMute,
  onSetOnboardDestinationStop,
  onOpenOnboardDashboard,
  isWatchShareModalOpen,
  onCloseWatchShareModal,
  onLaunchWatchView,
}) => {
  return (
    <>
      {/* Stop Arrivals Modal */}
      <StopArrivalsModal
        stop={activeTab !== 'map' ? selectedStop : null}
        onClose={onCloseStopModal}
        isFavorite={selectedStop ? isFavoriteStop(selectedStop.code) : false}
        onToggleFavorite={onToggleFavoriteStop}
        onViewOnMap={onViewStopOnMap}
        onSetAlarm={onSetAlarm}
        onStartOnboard={onStartOnboardFromArrival}
        onLocateBus={onLocateBus}
        userLat={userLat}
        userLon={userLon}
        onRequestLocation={onRequestLocation}
      />

      {/* Onboard Setup Modal */}
      {onboardSetup && (
        <OnboardSetupModal
          isOpen={Boolean(onboardSetup)}
          onClose={onCloseOnboardSetup}
          route={onboardSetup.route}
          originStop={onboardSetup.originStop}
          vehicleId={onboardSetup.vehicleId}
          onConfirmTrip={onStartTrip}
        />
      )}

      {/* Onboard Dashboard Full HUD Modal */}
      <OnboardDashboardModal
        isOpen={isOnboardDashboardOpen}
        onClose={onCloseOnboardDashboard}
        onEndTrip={onEndTrip}
        trip={onboardTrip}
        metrics={onboardMetrics}
        isBellActive={isBellActive}
        onRingBell={onRingBell}
        onAdvanceStop={onAdvanceStop}
        onRewindStop={onRewindStop}
        onToggleMute={onToggleOnboardMute}
        onSelectDestination={onSetOnboardDestinationStop}
      />

      {/* Onboard Minimized Floating Bottom Bar */}
      {onboardTrip && !isOnboardDashboardOpen && (
        <OnboardMiniBar
          trip={onboardTrip}
          metrics={onboardMetrics}
          onExpand={onOpenOnboardDashboard}
        />
      )}

      {/* Apple Watch Share & Companion Guide Modal */}
      <WatchShareModal
        isOpen={isWatchShareModalOpen}
        onClose={onCloseWatchShareModal}
        onLaunchWatchView={onLaunchWatchView}
      />
    </>
  );
};
