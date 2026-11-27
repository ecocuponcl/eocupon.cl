'use client';

// Punto único de registro de GSAP.
//
// Se importa sólo desde componentes cliente: GSAP y ScrollTrigger corren en el
// navegador y nunca deben ejecutarse durante el render del servidor.
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText, useGSAP };
