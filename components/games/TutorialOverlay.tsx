"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorialStep {
    title: string;
    description: string;
    image?: React.ReactNode;
}

interface TutorialOverlayProps {
    title: string;
    steps: TutorialStep[];
    onComplete: () => void;
    onClose: () => void;
    isOpen: boolean;
}

export default function TutorialOverlay({
    title,
    steps,
    onComplete,
    onClose,
    isOpen
}: TutorialOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            onComplete();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <h3 className="text-lg font-bold text-white">{title}</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="mb-6 min-h-[120px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4"
                                    >
                                        {steps[currentStep].image && (
                                            <div className="flex justify-center mb-4">
                                                {steps[currentStep].image}
                                            </div>
                                        )}
                                        <h4 className="text-xl font-bold text-cyan-400">
                                            {steps[currentStep].title}
                                        </h4>
                                        <p className="text-slate-300 leading-relaxed">
                                            {steps[currentStep].description}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Progress Dots */}
                            <div className="flex justify-center gap-2 mb-6">
                                {steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-all duration-300",
                                            idx === currentStep
                                                ? "bg-cyan-400 w-6"
                                                : idx < currentStep
                                                    ? "bg-cyan-400/50"
                                                    : "bg-slate-700"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Actions */}
                            <Button
                                onClick={handleNext}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-6 text-lg"
                            >
                                {currentStep === steps.length - 1 ? (
                                    <>
                                        Let's Play <Check className="ml-2 w-5 h-5" />
                                    </>
                                ) : (
                                    <>
                                        Next <ChevronRight className="ml-2 w-5 h-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
