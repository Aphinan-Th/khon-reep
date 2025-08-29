"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MapPin, Map as MapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import type { Location } from "@/components/map";
import { motion, AnimatePresence } from "framer-motion";
import { PIN_TYPE } from "@/constants/enum";
import { getIPAddress } from "@/actions/get-ip-address";

const Map = dynamic(() => import("@/components/map"), { ssr: false });

const PIN_OPTIONS = [
  {
    type: PIN_TYPE.SIDEWALK_OR_MOTORBIKE,
    label: (
      <div className="flex-col gap-4">
        <h1 className="text-5xl">🛵</h1>
        การขับขี่มอเตอร์ไซค์บนทางเท้า
      </div>
    ),
    className: "bg-green-600 text-white",
  },
  {
    type: PIN_TYPE.ZEBRA_CROSSING_MISUSE,
    label: (
      <div className="flex-col gap-4">
        <h1 className="text-5xl">🚗</h1>
        ไม่ชะลอความเร็ว <br /> ขณะมีคนข้ามทางมาลาย
      </div>
    ),
    className: "bg-blue-600 text-white",
  },
  {
    type: PIN_TYPE.WRONG_DIRECTION,
    label: (
      <div className="flex-col gap-4">
        <h1 className="text-5xl">🚘</h1>
        การขับรถย้อนศร
      </div>
    ),
    className: "bg-yellow-400 text-black",
  },
  {
    type: PIN_TYPE.TRAFFIC_LIGHT_BLINDNESS,
    label: (
      <div className="flex-col gap-4">
        <h1 className="text-5xl">🚦</h1>
        ผ่าไฟแดง
      </div>
    ),
    className: "bg-red-600 text-white",
  },
];

export default function Home() {
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState<"pin" | "map">("pin");
  const [loading, setLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  const supabase = createClient();

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("locations").select();
    if (error) {
      console.error("Error fetching locations:", error);
    } else {
      setAllLocations(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (activeTab === "map") fetchLocations();
  }, [activeTab, fetchLocations]);

  const handleGetLocation = useCallback(
    (type: PIN_TYPE) => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const ip = (await getIPAddress()) || "unknown";
          const newLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            user_agent: navigator.userAgent,
            type: type,
            ip_address: ip,
          };

          const { error } = await supabase.from("locations").insert([newLocation]);
          if (error) {
            alert("Could not save location.");
            console.error("Supabase insert error:", error);
            return;
          }
          setAllLocations((prev) => [...prev, { ...newLocation, id: crypto.randomUUID() }]);
          setPinSuccess(true);
          setTimeout(() => setPinSuccess(false), 2000);
        },
        () => alert("Unable to retrieve location.")
      );
    },
    [supabase]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-screen w-screen">
      <div className="h-full">
        <AnimatePresence mode="wait">
          {activeTab === "pin" && (
            <PinTab options={PIN_OPTIONS} onPin={handleGetLocation} pinSuccess={pinSuccess} />
          )}
          {activeTab === "map" && !loading && <Map locations={allLocations} />}
        </AnimatePresence>
      </div>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

interface ClickPopProps {
  clickPos: { x: number; y: number };
  count: number;
}

function ClickPop({ clickPos, count }: ClickPopProps) {
  const randomRotate = Math.random() * 90 - 45;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: randomRotate }}
      animate={{ opacity: 1, scale: 1.2 }}
      exit={{ opacity: 0, scale: 0.3 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 20,
        duration: 0.3,
      }}
      style={{
        position: "fixed",
        top: clickPos.y,
        left: clickPos.x,
        transform: "translate(-50%, -50%)",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <h1 className="text-4xl text-green-500 text-shadow-stroke-white-2">{count}</h1>
    </motion.div>
  );
}

function PinTab({
  options,
  onPin,
  pinSuccess,
}: {
  options: { label: React.ReactNode; className: string; type: PIN_TYPE }[];
  onPin: (type: PIN_TYPE) => void;
  pinSuccess: boolean;
}) {
  const [count, setCount] = useState(0);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });
  const [localPinSuccess, setLocalPinSuccess] = useState(false);

  const handleClick = (e: React.MouseEvent, type: PIN_TYPE) => {
    setClickPos({ x: e.clientX, y: e.clientY });
    setCount((prev) => prev + 1);
    setLocalPinSuccess(true);
    onPin(type);
    setTimeout(() => setLocalPinSuccess(false), 600); // faster feedback
  };

  return (
    <motion.div
      key="pin"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-6 text-center h-full w-full relative"
    >
      <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full p-2">
        {options.map(({ label, className, type }, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => handleClick(e, type)}
            className={`rounded-sm font-bold text-center text-base leading-snug p-4 h-full w-full flex items-center justify-center transition-colors duration-300 shadow-lg break-words line-clamp-2 ${className}`}
          >
            {label}
          </motion.button>
        ))}
      </div>

      {(pinSuccess || localPinSuccess) && <ClickPop clickPos={clickPos} count={count} />}
    </motion.div>
  );
}

function TabBar({
  activeTab,
  setActiveTab,
}: {
  activeTab: "pin" | "map";
  setActiveTab: React.Dispatch<React.SetStateAction<"pin" | "map">>;
}) {
  return (
    <div className="flex items-center justify-around rounded-t-3xl z-50 h-16">
      <TabButton
        active={activeTab === "pin"}
        icon={<MapPin size={22} />}
        label="Pin"
        onClick={() => setActiveTab("pin")}
      />
      <TabButton
        active={activeTab === "map"}
        icon={<MapIcon size={22} />}
        label="Map"
        onClick={() => setActiveTab("map")}
      />
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-1/2 h-full flex items-center justify-center gap-1 font-semibold ${active ? "bg-blue-400 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
    >
      <div className="w-10 h-10 flex items-center justify-center">{icon}</div>
      <span className="text-sm">{label}</span>
    </motion.button>
  );
}
