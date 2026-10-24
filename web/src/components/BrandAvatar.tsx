"use client";

type BrandAvatarProps = { size?: number; className?: string };

export function BrandAvatar({ size = 96, className = "" }: BrandAvatarProps) {
  return (
    <svg
      aria-label="Avatar ilustrado The Grind Lab"
      role="img"
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="80" cy="80" r="77" fill="#0B100F" stroke="#C5F36B" strokeWidth="2" />
      <path d="M19 142C25 115 43 103 60 99H100C119 105 136 118 141 142L126 151H34L19 142Z" fill="#17211A" stroke="#4A5A4D" strokeWidth="2" />
      <path d="M49 46C48 27 62 17 82 18C104 18 117 31 116 50L110 69H51L49 46Z" fill="#141A16" stroke="#9AA39A" strokeWidth="2" />
      <path d="M43 43C47 20 65 11 88 14C108 16 120 27 124 42L99 36L68 37L43 43Z" fill="#242B26" stroke="#D7DAD4" strokeWidth="2" />
      <path d="M39 42L124 42L137 50L32 50L39 42Z" fill="#111713" stroke="#C5F36B" strokeWidth="2" />
      <path d="M48 48C46 61 47 83 58 97L67 108L94 108L106 94C115 79 116 61 111 48" fill="#6E716B" stroke="#A8ADA5" strokeWidth="2" />
      <path d="M47 58C35 51 30 61 34 80C36 93 43 98 52 94" fill="#171D19" stroke="#A1A79F" strokeWidth="3" />
      <path d="M112 58C125 51 130 61 126 80C124 93 117 98 108 94" fill="#171D19" stroke="#A1A79F" strokeWidth="3" />
      <path d="M42 58L70 56L78 69L72 80L45 78L39 69L42 58Z" fill="#101512" stroke="#D6DAD2" strokeWidth="2" />
      <path d="M82 69L90 56L118 58L121 69L115 78L88 80L82 69Z" fill="#101512" stroke="#D6DAD2" strokeWidth="2" />
      <path d="M70 62L90 62" stroke="#C5F36B" strokeWidth="3" />
      <path d="M81 70L76 83L84 87" stroke="#363D37" strokeWidth="3" strokeLinecap="round" />
      <path d="M59 88C67 94 94 94 102 87L108 97C102 113 92 120 80 120C67 120 57 112 52 98L59 88Z" fill="#A7AAA2" />
      <path d="M54 92C64 99 96 99 106 91L101 110L89 122L72 122L59 109L54 92Z" fill="#555B54" />
      <path d="M63 101L70 107M77 103L82 112M91 102L96 107M66 113L72 118M87 115L93 110" stroke="#C9CCC4" strokeWidth="2" strokeLinecap="round" />
      <path d="M55 120L80 135L105 120L119 132L110 151H50L41 132L55 120Z" fill="#101512" stroke="#58675A" strokeWidth="2" />
      <path d="M69 130L80 139L91 130" stroke="#C5F36B" strokeWidth="3" strokeLinejoin="round" />
      <path d="M72 140L80 130L88 140" stroke="#C5F36B" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
