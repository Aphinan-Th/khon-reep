"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Map as MapIcon, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import type { Location } from "@/components/map";
import { motion, AnimatePresence } from "framer-motion";

const Map = dynamic(() => import("@/components/map"), { ssr: false });

export default function Home() {
	const [allLocations, setAllLocations] = useState<Location[]>([]);
	const [activeTab, setActiveTab] = useState<"pin" | "map">("pin");
	const [loading, setLoading] = useState(false);
	const [pinSuccess, setPinSuccess] = useState(false);

	const supabase = createClient();

	useEffect(() => {
		const fetchLocations = async () => {
			try {
				setLoading(true);
				const { data, error } = await supabase.from("locations").select();
				if (error) throw error;
				setAllLocations(data || []);
			} catch (error) {
				console.error("Error fetching locations:", error);
			} finally {
				setLoading(false);
			}
		};

		if (activeTab === "map") fetchLocations();
	}, [activeTab, supabase]);

	const handleGetLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				async (pos) => {
					const newLocation = {
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
						user_agent: navigator.userAgent,
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
		} else alert("Geolocation is not supported by your browser.");
	};

	return (
		<div className="max-h-svh min-h-svh min-w-full flex flex-col justify-between">
			<div className="flex-1 flex items-center justify-center px-4 pt-12 pb-24">
				<AnimatePresence mode="wait">
					{activeTab === "pin" && (
						<motion.div
							key="pin"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={{ duration: 0.4 }}
							className="flex flex-col items-center gap-6 text-center"
						>
							<div className="relative w-52 h-52 flex items-center justify-center">
								<span
									className={`absolute w-full h-full rounded-full ${
										pinSuccess ? "bg-green-400/40" : "bg-red-400/50 animate-ping"
									}`}
								/>
								<motion.button
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.95 }}
									onClick={handleGetLocation}
									className={`w-48 h-48 rounded-full text-white flex items-center justify-center transition-colors duration-300 relative z-10 ${
										pinSuccess
											? "bg-green-500"
											: "bg-[#b71c1c] hover:shadow-3xl border-[#f44336] border-[1rem] shadow-[#1565c0]"
									}`}
								>
									<motion.div
										animate={pinSuccess ? { scale: [1, 1.4, 1], rotate: [0, 20, -20, 0] } : {}}
										transition={{ duration: 0.6 }}
									>
										{pinSuccess ? (
											<Check size={32} strokeWidth={2} />
										) : (
											<MapPin size={32} strokeWidth={2} />
										)}
									</motion.div>
								</motion.button>
							</div>
						</motion.div>
					)}

					{activeTab === "map" && (
						<motion.div
							key="map"
							initial={{ opacity: 0, y: 0 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 0 }}
							transition={{ duration: 0.4 }}
							className="w-full max-w-4xl"
						>
							<div className="w-full h-96 rounded-lg shadow-lg overflow-hidden">
								{!loading && <Map locations={allLocations} />}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="fixed bottom-0 left-0 right-0 h-14 flex items-center justify-around rounded-t-3xl z-50">
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
			className={`w-1/2 h-full flex items-center justify-center gap-1 font-semibold ${
				active ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
			}`}
		>
			<div className="w-10 h-10 flex items-center justify-center">{icon}</div>
			<span className="text-sm">{label}</span>
		</motion.button>
	);
}
