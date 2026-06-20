'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';

type LocationAddress = {
  id?: string;
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPrimary?: boolean | null;
};

type LocationItem = {
  id: string;
  name: string;
  kuerzel?: string | null;
  addresses?: LocationAddress[];
};

type LocatedLocation = {
  location: LocationItem;
  address: LocationAddress;
  position: [number, number];
};

type MapFilter = 'all' | 'located' | 'unlocated';

const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-85, -180],
  [85, 180],
];

type LexTrackLocationMapProps = {
  locations: LocationItem[];
  selectedLocationId: string | null;
  isDe: boolean;
  onSelectLocation: (locationId: string | null) => void;
};

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function getLocationLabel(location: LocationItem): string {
  return location.kuerzel
    ? location.kuerzel + ' ' + String.fromCharCode(0x2014) + ' ' + location.name
    : location.name;
}

function getPrimaryAddress(location: LocationItem): LocationAddress | null {
  const addresses = Array.isArray(location.addresses) ? location.addresses : [];
  if (addresses.length === 0) return null;

  return addresses.find((address) => address?.isPrimary) ?? addresses[0] ?? null;
}

function hasCoordinates(address: LocationAddress | null): address is LocationAddress & {
  latitude: number;
  longitude: number;
} {
  return (
    typeof address?.latitude === 'number' &&
    Number.isFinite(address.latitude) &&
    typeof address?.longitude === 'number' &&
    Number.isFinite(address.longitude)
  );
}

function getAddressPreview(location: LocationItem, isDe: boolean): string {
  const address = getPrimaryAddress(location);
  const streetLine = [address?.street, address?.houseNumber].map(clean).filter(Boolean).join(' ');
  const cityLine = [address?.postalCode, address?.city].map(clean).filter(Boolean).join(' ');
  const country = clean(address?.country);

  return [streetLine, cityLine, country].filter(Boolean).join(', ') ||
    (isDe ? 'Keine Adresse gepflegt' : 'No address maintained');
}

function FitBounds({
  points,
  selectedPoint,
}: {
  points: Array<[number, number]>;
  selectedPoint: [number, number] | null;
}) {
  const map = useMap();

  const pointsKey = points.map((point) => point.join(',')).join('|');
  const selectedKey = selectedPoint ? selectedPoint.join(',') : '';

  useEffect(() => {
    if (selectedPoint) {
      map.setView(selectedPoint, 11, { animate: true });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 10, { animate: true });
      return;
    }

    if (points.length > 1) {
      map.fitBounds(points, {
        padding: [48, 48],
        maxZoom: 10,
        animate: true,
      });
    }
  }, [map, pointsKey, selectedKey]);

  return null;
}

export default function LexTrackLocationMap({
  locations,
  selectedLocationId,
  isDe,
  onSelectLocation,
}: LexTrackLocationMapProps) {
  const [filter, setFilter] = useState<MapFilter>('all');
  const [query, setQuery] = useState('');

  const locatedLocations = useMemo<LocatedLocation[]>(() => {
    return locations
      .map((location) => {
        const address = getPrimaryAddress(location);
        if (!hasCoordinates(address)) return null;

        return {
          location,
          address,
          position: [address.latitude, address.longitude] as [number, number],
        };
      })
      .filter(Boolean) as LocatedLocation[];
  }, [locations]);

  const unlocatedLocations = useMemo(() => {
    return locations.filter((location) => !hasCoordinates(getPrimaryAddress(location)));
  }, [locations]);

  const normalizedQuery = query.trim().toLowerCase();

  const matchesQuery = (location: LocationItem) => {
    if (!normalizedQuery) return true;

    return [
      location.name,
      location.kuerzel,
      getAddressPreview(location, isDe),
    ]
      .map((value) => clean(value).toLowerCase())
      .some((value) => value.includes(normalizedQuery));
  };

  const visibleLocatedLocations = locatedLocations.filter(({ location }) => {
    if (filter === 'unlocated') return false;
    return matchesQuery(location);
  });

  const visibleUnlocatedLocations = unlocatedLocations.filter((location) => {
    if (filter === 'located') return false;
    return matchesQuery(location);
  });

  const selectedLocated =
    locatedLocations.find((item) => item.location.id === selectedLocationId) ?? null;

  const selectedPoint = selectedLocated?.position ?? null;
  const mapPoints = visibleLocatedLocations.map((item) => item.position);
  const initialCenter: [number, number] =
    selectedPoint ?? mapPoints[0] ?? [51.1657, 10.4515];

  const filterButtonClass = (active: boolean) =>
    [
      'rounded-lg px-3 py-2 text-xs font-semibold transition',
      active
        ? 'bg-[#00559F] text-white shadow-sm'
        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
    ].join(' ');

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isDe ? 'Kartenansicht' : 'Map view'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isDe
                ? 'Standorte werden anhand gepflegter Adressdaten automatisch lokalisiert.'
                : 'Locations are automatically positioned based on maintained address data.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {locatedLocations.length} / {locations.length} {isDe ? 'lokalisiert' : 'located'}
            </span>

            {selectedLocationId && (
              <button
                type="button"
                onClick={() => onSelectLocation(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {isDe ? 'Auswahl zur' + String.fromCharCode(0x00fc) + 'cksetzen' : 'Clear selection'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilter('all')} className={filterButtonClass(filter === 'all')}>
              {isDe ? 'Alle anzeigen' : 'Show all'}
            </button>
            <button type="button" onClick={() => setFilter('located')} className={filterButtonClass(filter === 'located')}>
              {isDe ? 'Nur lokalisiert' : 'Located only'}
            </button>
            <button type="button" onClick={() => setFilter('unlocated')} className={filterButtonClass(filter === 'unlocated')}>
              {isDe ? 'Nicht lokalisiert' : 'Not located'}
            </button>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isDe ? 'Standort, K' + String.fromCharCode(0x00fc) + 'rzel oder Adresse suchen ...' : 'Search location, code or address ...'}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00559F] focus:ring-2 focus:ring-[#00559F]/15 lg:max-w-sm"
          />
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {visibleLocatedLocations.length > 0 ? (
            <div className="relative">
              <MapContainer
                center={initialCenter}
                zoom={selectedPoint ? 11 : 6}
                minZoom={2}
                maxBounds={WORLD_BOUNDS}
                maxBoundsViscosity={1.0}
                worldCopyJump={false}
                scrollWheelZoom
                className="h-[460px] w-full"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  noWrap={true}
                />

                <FitBounds points={mapPoints} selectedPoint={selectedPoint} />

                {visibleLocatedLocations.map(({ location, address, position }) => {
                  const isSelected = selectedLocationId === location.id;

                  return (
                    <CircleMarker
                      key={location.id}
                      center={position}
                      radius={isSelected ? 12 : 9}
                      pathOptions={{
                        color: isSelected ? '#00559F' : '#0f766e',
                        fillColor: isSelected ? '#00559F' : '#10b981',
                        fillOpacity: 0.85,
                        weight: isSelected ? 4 : 2,
                      }}
                      eventHandlers={{
                        click: () => onSelectLocation(location.id),
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                        <span className="text-xs font-semibold">{getLocationLabel(location)}</span>
                      </Tooltip>

                      <Popup>
                        <div className="min-w-[180px]">
                          <div className="text-sm font-semibold">{getLocationLabel(location)}</div>
                          <div className="mt-1 text-xs text-slate-600">
                            {getAddressPreview(location, isDe)}
                          </div>
                          <div className="mt-2 text-[11px] text-slate-500">
                            {address.latitude?.toFixed(6)}, {address.longitude?.toFixed(6)}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>

              <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-4 py-3 text-sm shadow-lg ring-1 ring-slate-200">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {selectedLocated ? (isDe ? 'Aktiver Standort' : 'Active location') : (isDe ? 'Gesamt' + String.fromCharCode(0x00fc) + 'bersicht' : 'Overview')}
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {selectedLocated ? getLocationLabel(selectedLocated.location) : (isDe ? 'Alle lokalisierten Standorte' : 'All located sites')}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {visibleLocatedLocations.length} {isDe ? 'Pin(s) sichtbar' : 'pin(s) visible'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center bg-slate-50 px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                <span className="text-2xl">?</span>
              </div>
              <h4 className="mt-4 text-lg font-semibold text-slate-900">
                {isDe ? 'Keine sichtbaren Kartenpins' : 'No visible map pins'}
              </h4>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                {isDe
                  ? 'Passe Filter oder Suche an, oder pflege Standortadressen mit mindestens PLZ, Ort und Land.'
                  : 'Adjust filters or search, or maintain location addresses with at least postal code, city and country.'}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visibleLocatedLocations.map(({ location, address }) => {
            const isSelected = selectedLocationId === location.id;

            return (
              <button
                key={location.id}
                type="button"
                onClick={() => onSelectLocation(isSelected ? null : location.id)}
                className={[
                  'rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition hover:border-[#00559F] hover:bg-sky-50/40',
                  isSelected ? 'border-[#00559F] ring-2 ring-[#00559F]/15' : 'border-slate-200',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {isDe ? 'Lokalisierter Standort' : 'Located site'}
                    </div>

                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {getLocationLabel(location)}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {getAddressPreview(location, isDe)}
                    </div>

                    <div className="mt-2 text-[11px] font-medium text-slate-400">
                      {address.latitude?.toFixed(6)}, {address.longitude?.toFixed(6)}
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {isDe ? 'Pin aktiv' : 'Pin active'}
                  </span>
                </div>
              </button>
            );
          })}

          {visibleUnlocatedLocations.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => onSelectLocation(selectedLocationId === location.id ? null : location.id)}
              className={[
                'rounded-xl border border-dashed px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100',
                selectedLocationId === location.id ? 'bg-slate-100 ring-2 ring-slate-200' : 'bg-slate-50',
              ].join(' ')}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {isDe ? 'Nicht lokalisiert' : 'Not located'}
              </div>

              <div className="mt-1 text-sm font-semibold text-slate-700">
                {getLocationLabel(location)}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {getAddressPreview(location, isDe)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
