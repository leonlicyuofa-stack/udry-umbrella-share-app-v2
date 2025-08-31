
"use client";

import { Map, Marker, Pin, InfoWindow, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { Stall } from '@/lib/types';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Umbrella, MapPinIcon, Loader2, CornerDownLeft, LocateFixed, Navigation, QrCode, Info } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { ScanAndRentDialog } from '@/components/rental/scan-and-rent-dialog';
import { useStalls } from '@/contexts/stalls-context';
import { defaultMapCenter } from '@/lib/mock-data';
import { RentalInitiationDialog } from '@/components/rental/rental-initiation-dialog';

// --- User-provided SVG Icon ---
const UmbrellaMapIcon = () => (
    <svg
        id="svg"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="40"
        height="40"
        viewBox="0 0 400 400"
    >
        <defs>
            <clipPath id="circle-clip">
                <circle cx="200" cy="200" r="200" />
            </clipPath>
        </defs>
        <g id="svgg" clipPath="url(#circle-clip)">
            <path
                id="path0"
                d="M188.477 69.412 C 83.290 78.862,31.533 201.432,98.273 283.034 C 164.609 364.143,294.429 338.066,324.983 237.494 C 351.576 149.962,279.516 61.234,188.477 69.412 M203.516 100.266 C 207.184 101.760,208.323 103.985,208.323 109.652 L 208.323 114.033 210.119 114.266 C 257.788 120.449,298.759 160.827,303.740 206.530 L 304.004 208.959 299.272 207.006 C 282.673 200.155,268.899 200.516,253.389 208.210 C 248.668 210.551,248.990 210.842,249.962 205.115 C 256.244 168.130,242.562 136.582,216.016 126.837 C 209.417 124.414,209.420 124.411,214.004 129.186 C 233.732 149.740,242.691 171.296,244.946 203.633 C 245.197 207.242,245.307 210.292,245.189 210.410 C 245.071 210.528,242.360 209.317,239.164 207.719 C 232.726 204.499,224.737 201.703,218.359 200.437 C 213.743 199.521,208.681 198.871,208.394 199.159 C 208.289 199.263,208.202 214.481,208.200 232.975 C 208.197 268.120,208.141 269.441,206.443 274.300 C 198.055 298.309,163.778 300.376,152.731 277.539 C 148.181 268.133,149.655 259.953,156.215 258.207 C 161.238 256.870,165.621 260.356,166.365 266.281 C 167.988 279.208,187.562 280.908,191.408 268.456 C 192.161 266.019,192.188 264.801,192.188 232.519 L 192.188 199.104 189.355 199.344 C 180.395 200.105,168.370 203.842,158.203 209.025 C 155.518 210.395,153.188 211.575,153.027 211.649 C 152.597 211.847,152.670 203.069,153.138 198.381 C 155.982 169.840,167.881 145.152,187.276 127.552 C 191.247 123.949,191.182 123.824,186.055 125.181 C 158.262 132.537,142.868 165.592,149.048 204.645 C 149.750 209.084,149.940 208.881,146.651 207.224 C 133.443 200.571,115.659 200.813,100.044 207.858 C 96.812 209.317,96.955 209.397,97.352 206.348 C 103.152 161.897,142.791 120.976,185.817 115.021 C 188.354 114.670,190.807 114.312,191.268 114.225 C 192.063 114.076,192.114 113.815,192.245 109.280 C 192.486 100.919,196.750 97.509,203.516 100.266 "
                stroke="none"
                fill="#045aa2"
                fillRule="evenodd"
            ></path>
            <path
                id="path1"
                d="M0.000 200.000 L 0.000 400.000 200.000 400.000 L 400.000 400.000 400.000 200.000 L 400.000 0.000 200.000 0.000 L 0.000 0.000 0.000 200.000 M215.154 69.710 C 291.184 79.481,342.232 149.443,328.315 224.798 C 318.550 277.668,274.420 320.819,221.094 329.641 C 123.678 345.758,43.544 251.532,75.128 158.008 C 92.081 107.808,136.176 73.821,190.625 68.987 C 194.449 68.648,210.590 69.123,215.154 69.710 M196.564 100.416 C 193.269 102.096,192.214 104.607,192.197 110.809 L 192.188 114.391 189.551 114.651 C 145.053 119.033,103.914 160.177,97.474 206.738 C 97.164 208.982,96.779 208.976,102.178 206.816 C 118.129 200.434,133.709 200.489,146.575 206.974 C 148.236 207.811,149.512 208.361,149.410 208.197 C 148.084 206.050,147.162 184.268,148.064 176.367 C 150.990 150.740,165.326 131.010,185.207 125.248 C 192.271 123.201,192.278 122.928,185.085 130.125 C 166.603 148.620,157.050 168.495,153.716 195.393 C 153.043 200.818,152.482 211.328,152.865 211.328 C 153.003 211.328,155.360 210.207,158.101 208.837 C 168.813 203.484,179.963 200.044,189.954 199.009 L 192.603 198.734 192.493 232.863 C 192.383 266.888,192.380 266.999,191.533 269.065 C 186.501 281.339,167.688 279.131,166.049 266.074 C 164.528 253.960,149.834 256.012,150.473 268.249 C 151.912 295.793,192.712 302.720,204.911 277.491 C 208.210 270.669,207.974 274.791,208.135 221.341 L 208.203 198.737 210.840 199.004 C 219.782 199.909,230.187 203.027,239.024 207.451 L 245.039 210.463 244.783 204.939 C 243.321 173.392,233.696 149.937,213.696 129.183 C 210.481 125.847,209.461 124.576,210.156 124.773 C 227.945 129.793,238.975 139.749,246.115 157.230 C 251.661 170.809,253.136 189.493,249.968 206.055 C 249.557 208.203,249.221 209.993,249.220 210.033 C 249.219 210.073,251.108 209.161,253.418 208.006 C 269.988 199.724,282.631 199.836,303.350 208.450 C 304.881 209.087,301.098 192.289,297.834 183.961 C 283.336 146.960,249.192 119.425,212.050 114.780 L 208.279 114.308 208.144 109.567 C 207.912 101.493,202.633 97.321,196.564 100.416 "
                stroke="none"
                fill="#fbfbfb"
                fillRule="evenodd"
            ></path>
            <path
                id="path2"
                d="M192.676 69.019 C 193.052 69.118,193.667 69.118,194.043 69.019 C 194.419 68.921,194.111 68.841,193.359 68.841 C 192.607 68.841,192.300 68.921,192.676 69.019 M106.436 107.520 L 103.320 110.742 106.543 107.626 C 109.536 104.732,109.944 104.297,109.659 104.297 C 109.600 104.297,108.150 105.747,106.436 107.520 M184.161 130.566 L 182.617 132.227 184.277 130.682 C 185.821 129.246,186.117 128.906,185.821 128.906 C 185.758 128.906,185.011 129.653,184.161 130.566 M68.115 199.805 C 68.116 202.168,68.180 203.084,68.258 201.841 C 68.336 200.598,68.335 198.664,68.256 197.544 C 68.178 196.424,68.114 197.441,68.115 199.805 M192.363 252.344 C 192.363 259.541,192.415 262.485,192.480 258.887 C 192.544 255.288,192.544 249.399,192.480 245.801 C 192.415 242.202,192.363 245.146,192.363 252.344 M207.960 248.828 C 207.960 251.299,208.024 252.310,208.101 251.074 C 208.179 249.839,208.179 247.817,208.101 246.582 C 208.024 245.347,207.960 246.357,207.960 248.828 M207.911 265.430 C 207.915 266.289,207.995 266.595,208.089 266.109 C 208.182 265.623,208.179 264.920,208.081 264.546 C 207.983 264.173,207.907 264.570,207.911 265.430 M178.418 277.229 C 178.901 277.322,179.692 277.322,180.176 277.229 C 180.659 277.136,180.264 277.060,179.297 277.060 C 178.330 277.060,177.935 277.136,178.418 277.229 M292.179 292.480 L 288.867 295.898 292.285 292.587 C 295.460 289.511,295.881 289.063,295.597 289.063 C 295.538 289.063,294.000 290.601,292.179 292.480 M107.227 293.359 C 108.719 294.863,110.028 296.094,110.135 296.094 C 110.243 296.094,109.110 294.863,107.617 293.359 C 106.125 291.855,104.816 290.625,104.708 290.625 C 104.601 290.625,105.734 291.855,107.227 293.359 "
                stroke="none"
                fill="#97abbd"
                fillRule="evenodd"
            ></path>
            <path
                id="path3"
                d="M208.294 109.766 C 208.294 110.518,208.374 110.825,208.472 110.449 C 208.571 110.073,208.571 109.458,208.472 109.082 C 208.374 108.706,208.294 109.014,208.294 109.766 M165.405 137.207 L 164.258 138.477 165.527 137.329 C 166.711 136.260,166.976 135.938,166.675 135.938 C 166.607 135.938,166.036 136.509,165.405 137.207 M192.347 207.031 C 192.347 210.576,192.406 212.026,192.478 210.254 C 192.551 208.481,192.551 205.581,192.478 203.809 C 192.406 202.036,192.347 203.486,192.347 207.031 M192.357 229.102 C 192.357 234.473,192.412 236.724,192.479 234.105 C 192.547 231.485,192.547 227.091,192.480 224.339 C 192.412 221.587,192.357 223.730,192.357 229.102 M178.027 293.635 C 178.511 293.728,179.302 293.728,179.785 293.635 C 180.269 293.542,179.873 293.466,178.906 293.466 C 177.939 293.466,177.544 293.542,178.027 293.635 "
                stroke="none"
                fill="#7494aa"
                fillRule="evenodd"
            ></path>
            <path
                id="path4"
                d="M197.572 69.038 C 198.707 69.118,200.465 69.117,201.478 69.037 C 202.491 68.956,201.563 68.892,199.414 68.893 C 197.266 68.894,196.437 68.959,197.572 69.038 M291.797 107.227 C 293.181 108.623,294.401 109.766,294.509 109.766 C 294.616 109.766,293.572 108.623,292.188 107.227 C 290.803 105.830,289.583 104.688,289.476 104.688 C 289.368 104.688,290.413 105.830,291.797 107.227 M212.500 127.930 C 213.884 129.326,215.104 130.469,215.212 130.469 C 215.319 130.469,214.275 129.326,212.891 127.930 C 211.507 126.533,210.286 125.391,210.179 125.391 C 210.071 125.391,211.116 126.533,212.500 127.930 M271.875 144.727 C 273.259 146.123,274.479 147.266,274.587 147.266 C 274.694 147.266,273.650 146.123,272.266 144.727 C 270.882 143.330,269.661 142.188,269.554 142.188 C 269.446 142.188,270.491 143.330,271.875 144.727 M191.654 199.091 C 191.898 199.269,192.194 199.766,192.312 200.195 C 192.482 200.811,192.512 200.776,192.455 200.031 C 192.415 199.510,192.119 199.014,191.797 198.927 C 191.410 198.822,191.361 198.878,191.654 199.091 M192.286 216.602 C 192.290 217.461,192.370 217.767,192.464 217.281 C 192.557 216.795,192.554 216.092,192.456 215.718 C 192.358 215.345,192.282 215.742,192.286 216.602 "
                stroke="none"
                fill="#7c8ca4"
                fillRule="evenodd"
            ></path>
        </g>
    </svg>
);


export function MapDisplay() {
  const { toast } = useToast();
  const { stalls, isLoadingStalls } = useStalls();

  const [selectedMapStall, setSelectedMapStall] = useState<Stall | null>(null);
  const [stallForRentalDialog, setStallForRentalDialog] = useState<Stall | null>(null);
  const [clientMapId, setClientMapId] = useState<string | null>(null);
  
  const [currentMapCenter, setCurrentMapCenter] = useState<google.maps.LatLngLiteral>(defaultMapCenter);
  const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);

  const deployedStalls = useMemo(() => stalls.filter(stall => stall.isDeployed), [stalls]);

  useEffect(() => {
    // Set Map ID from environment variables
    const idFromEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
    if (idFromEnv && idFromEnv !== "YOUR_MAP_ID_HERE" && idFromEnv.trim() !== "") {
      setClientMapId(idFromEnv);
    } else {
      setClientMapId(null);
    }
  }, []);

  const handleMarkerClick = useCallback((stall: Stall) => {
    setSelectedMapStall(stall);
    if (stall.location) {
      setCurrentMapCenter({ lat: stall.location.latitude, lng: stall.location.longitude });
    }
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedMapStall(null);
  }, []);

  const handleLocateMe = () => {
    setIsLocating(true);
    setGeolocationError(null);
    setUserPosition(null); 

    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by your browser.";
      setGeolocationError(errorMsg);
      toast({ title: "Location Error", description: errorMsg, variant: "destructive" });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentMapCenter(newPos); 
        setUserPosition(newPos);    
        setMapZoom(15);             
        toast({ title: "Location Found!", description: "Map centered on your current location." });
        setIsLocating(false);
      },
      (error) => {
        let errorMsg = "Could not retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location permission denied. Please enable it in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMsg = "The request to get user location timed out.";
            break;
          default:
            errorMsg = "An unknown error occurred while trying to get your location.";
            break;
        }
        setGeolocationError(errorMsg);
        toast({ title: "Location Error", description: errorMsg, variant: "destructive" });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  
  if (isLoadingStalls) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-4 bg-muted/20 rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading map data...</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: 'relative', height: '70vh', width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 4px 12px hsla(var(--foreground), 0.1)' }}>
        <Map
          center={currentMapCenter}
          zoom={mapZoom}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId={clientMapId || undefined}
          style={{ width: '100%', height: '100%' }}
          onCenterChanged={(ev) => {
            if (ev.detail.center && !isLocating) {
               setCurrentMapCenter(ev.detail.center); 
            }
          }}
          onZoomChanged={(ev) => {
             if (!isLocating) {
              setMapZoom(ev.detail.zoom); 
             }
          }}
        >
          {deployedStalls.map((stall) => {
            if (!stall.location) return null;
            const position = { lat: stall.location.latitude, lng: stall.location.longitude };
            
            return (
              <AdvancedMarker
                key={stall.dvid}
                position={position}
                onClick={() => handleMarkerClick(stall)}
                title={stall.name}
              >
                <UmbrellaMapIcon />
              </AdvancedMarker>
            );
          })}

          {userPosition && (
             <Marker position={userPosition} title="Your Location" />
          )}

          {selectedMapStall && selectedMapStall.location && (
            <InfoWindow
              position={{ lat: selectedMapStall.location.latitude, lng: selectedMapStall.location.longitude }}
              onCloseClick={handleInfoWindowClose}
              minWidth={320}
            >
              <Card className="border-none shadow-none">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg text-primary flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2" /> {selectedMapStall.name}
                  </CardTitle>
                  <CardDescription className="text-xs">{selectedMapStall.address}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <div>
                    <p className="text-sm font-medium flex items-center">
                      <Umbrella className="h-4 w-4 mr-2 text-green-600" />
                      Available Umbrellas:
                      <span className={`font-bold ml-1 ${selectedMapStall.availableUmbrellas > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedMapStall.availableUmbrellas} / {selectedMapStall.totalUmbrellas}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center">
                       <CornerDownLeft className="h-4 w-4 mr-2 text-blue-600" />
                      Available Return Slots:
                      <span className={`font-bold ml-1 ${selectedMapStall.totalUmbrellas - selectedMapStall.availableUmbrellas > 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {selectedMapStall.totalUmbrellas - selectedMapStall.availableUmbrellas} / {selectedMapStall.totalUmbrellas}
                      </span>
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setStallForRentalDialog(selectedMapStall);
                      setSelectedMapStall(null); // Close info window
                    }}
                    className="w-full mt-2" 
                    size="sm"
                    disabled={selectedMapStall.availableUmbrellas === 0}
                  >
                    Rent Umbrella
                    <Umbrella className="ml-2 h-4 w-4" />
                  </Button>
                  {selectedMapStall.availableUmbrellas === 0 && <p className="text-xs text-destructive mt-1 text-center">No umbrellas available to rent at this stall.</p>}
                  {selectedMapStall.totalUmbrellas - selectedMapStall.availableUmbrellas === 0 && <p className="text-xs text-orange-600 mt-1 text-center">No empty slots to return an umbrella.</p>}
                </CardContent>
              </Card>
            </InfoWindow>
          )}
        </Map>
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
           <Button
              onClick={handleLocateMe}
              disabled={isLocating}
              variant="secondary"
              size="icon"
              className="shadow-lg rounded-full"
              aria-label="Locate Me"
          >
              {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
          </Button>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
           <Button
              onClick={() => setIsScanDialogOpen(true)}
              size="lg"
              className="shadow-lg rounded-full"
              aria-label="Scan and Rent"
            >
              <QrCode className="h-5 w-5 mr-2" />
              Scan & Rent
          </Button>
        </div>
        {geolocationError && (
          <div className="absolute bottom-4 right-4 z-10 bg-destructive/90 text-destructive-foreground p-2 rounded-md text-xs shadow-lg">
            {geolocationError}
          </div>
        )}
      </div>
      <ScanAndRentDialog 
        isOpen={isScanDialogOpen} 
        onOpenChange={setIsScanDialogOpen} 
        stalls={stalls}
        onStallScanned={(stall) => {
          setIsScanDialogOpen(false); // Close the scanner
          setStallForRentalDialog(stall); // Open the rental dialog
        }}
      />
      <RentalInitiationDialog 
        stall={stallForRentalDialog} 
        isOpen={!!stallForRentalDialog} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setStallForRentalDialog(null);
          }
        }} 
      />
    </>
  );
}
