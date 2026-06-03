import { motion } from "framer-motion";
import logo from "../../images/logos/logo.webp";

const brown = "#3A261B";
const softBrown = "#5A3A29";
const warmBrown = "#7A4A2A";
const bgFill = "var(--color-brand-bg)";

export default function BakingLoader() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-brand-bg px-4 text-[#3A261B]">
      <motion.div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8B5A2B]/12 blur-3xl"
        animate={{ scale: [1, 1.14, 1], x: [0, -14, 0], y: [0, 12, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[#3A261B]/8 blur-3xl"
        animate={{ scale: [1, 1.16, 1], x: [0, 18, 0], y: [0, -12, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 210, damping: 24 }}
        className="relative flex w-full max-w-sm flex-col items-center text-center"
      >
        <motion.img
          src={logo}
          alt="Baura Bakers"
          className="mb-3 h-20 w-20 object-contain sm:h-24 sm:w-24"
          loading="eager"
          decoding="async"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative flex h-[285px] w-full items-center justify-center">
          <motion.div
            className="absolute top-12 h-40 w-48 rounded-full bg-[#8B5A2B]/10 blur-3xl"
            animate={{
              scale: [0.9, 1.18, 0.9],
              opacity: [0.28, 0.65, 0.28],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.svg
            viewBox="0 0 300 265"
            className="relative h-[265px] w-[300px] max-w-full overflow-visible"
            fill="none"
            initial={{ y: 6 }}
            animate={{ y: [4, -2, 4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <defs>
              <clipPath id="oven-window-clip">
                <rect x="78" y="184" width="144" height="38" rx="12" />
              </clipPath>
            </defs>

            {/* outside aroma lines */}
            {[
              "M38 78 C24 64 23 45 36 34",
              "M65 43 L53 20",
              "M235 43 L247 20",
              "M262 78 C276 64 277 45 264 34",
              "M26 158 C12 145 12 126 24 114",
              "M274 158 C288 145 288 126 276 114",
            ].map((d, index) => (
              <motion.path
                key={`aura-${index}`}
                d={d}
                stroke={brown}
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ opacity: 0.12, pathLength: 0.2 }}
                animate={{
                  opacity: [0.12, 0.42, 0.12],
                  pathLength: [0.2, 1, 0.2],
                }}
                transition={{
                  duration: 2.9,
                  delay: index * 0.18,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* steam */}
            {[
              "M111 58 C95 38 125 32 111 10",
              "M140 60 C122 39 158 31 141 4",
              "M169 58 C153 38 183 32 169 10",
              "M198 62 C183 42 211 35 199 15",
            ].map((d, index) => (
              <motion.path
                key={`steam-${index}`}
                d={d}
                stroke={softBrown}
                strokeWidth="3.5"
                strokeLinecap="round"
                animate={{
                  y: [8, -10, 8],
                  opacity: [0.16, 0.65, 0.16],
                  pathLength: [0.35, 1, 0.35],
                }}
                transition={{
                  duration: 2.6,
                  delay: index * 0.18,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* oven body fill, same as background */}
            <path
              d="M64 88 H236 C250 88 258 97 258 111 V219 C258 233 249 242 235 242 H65 C51 242 42 233 42 219 V111 C42 97 50 88 64 88 Z"
              fill={bgFill}
            />

            {/* oven body stroke */}

            <motion.path
              d="M64 88 H236 C250 88 258 97 258 111 V219 C258 233 249 242 235 242 H65 C51 242 42 233 42 219 V111 C42 97 50 88 64 88 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{
                filter: [
                  "drop-shadow(0 16px 26px rgba(58,38,27,0.08))",
                  "drop-shadow(0 22px 34px rgba(58,38,27,0.14))",
                  "drop-shadow(0 16px 26px rgba(58,38,27,0.08))",
                ],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* control panel fill, same as background */}
            <path
              d="M61 104 H239 C246 104 250 109 250 116 V135 C250 142 246 146 239 146 H61 C54 146 50 142 50 135 V116 C50 109 54 104 61 104 Z"
              fill={bgFill}
            />

            {/* control panel stroke */}
            <path
              d="M61 104 H239 C246 104 250 109 250 116 V135 C250 142 246 146 239 146 H61 C54 146 50 142 50 135 V116 C50 109 54 104 61 104 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* knobs */}
            {[96, 138, 180].map((x, index) => (
              <motion.g
                key={x}
                style={{ transformOrigin: `${x}px 126px` }}
                animate={{ rotate: [0, 8, 0] }}
                transition={{
                  duration: 2,
                  delay: index * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <circle
                  cx={x}
                  cy="126"
                  r="10"
                  fill={bgFill}
                  stroke={brown}
                  strokeWidth="3.5"
                />
                <path
                  d={`M${x} 118 L${x} 126`}
                  stroke={brown}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </motion.g>
            ))}

            <path
              d="M211 126 H232"
              stroke={brown}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* handle */}
            <path
              d="M72 159 H228"
              stroke={brown}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M83 159 H217"
              stroke={brown}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.32"
            />

            {/* oven door fill, same as background */}
            <path
              d="M78 175 H222 C229 175 233 179 233 186 V219 C233 226 229 230 222 230 H78 C71 230 67 226 67 219 V186 C67 179 71 175 78 175 Z"
              fill={bgFill}
            />

            {/* oven door stroke */}
            <path
              d="M78 175 H222 C229 175 233 179 233 186 V219 C233 226 229 230 222 230 H78 C71 230 67 226 67 219 V186 C67 179 71 175 78 175 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* inner window fill, same as background */}
            <path
              d="M86 184 H214 C219 184 222 187 222 192 V213 C222 218 219 221 214 221 H86 C81 221 78 218 78 213 V192 C78 187 81 184 86 184 Z"
              fill={bgFill}
            />

            {/* soft oven warmth - clipped inside window */}
            <g clipPath="url(#oven-window-clip)">
              {[
                "M112 216 C108 210 118 207 114 201 C111 197 116 194 121 191",
                "M140 216 C135 210 146 207 141 201 C137 197 144 194 149 191",
                "M168 216 C163 210 174 207 169 201 C165 197 172 194 177 191",
                "M196 216 C192 210 202 207 198 201 C195 197 200 194 205 191",
              ].map((d, index) => (
                <motion.path
                  key={`heat-${index}`}
                  d={d}
                  stroke={warmBrown}
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  animate={{
                    y: [2, -2, 2],
                    opacity: [0.04, 0.18, 0.04],
                    pathLength: [0.25, 1, 0.25],
                  }}
                  transition={{
                    duration: 2.4,
                    delay: index * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}

              <motion.path
                d="M94 218 C122 213 178 213 206 218"
                stroke={warmBrown}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                animate={{
                  opacity: [0.04, 0.14, 0.04],
                  pathLength: [0.2, 1, 0.2],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </g>

            {/* inner window stroke */}
            <path
              d="M86 184 H214 C219 184 222 187 222 192 V213 C222 218 219 221 H86 C81 221 78 218 78 213 V192 C78 187 81 184 86 184 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.55"
            />

            {/* tray */}
            <path
              d="M92 218 H208"
              stroke={brown}
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* bread */}
            <motion.path
              d="M106 213 C108 193 126 190 138 203 C147 188 174 193 178 213 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ y: [0, -2, 0] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <path
              d="M123 204 C127 199 134 199 138 203"
              stroke={brown}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.42"
            />

            <path
              d="M153 200 C160 199 168 203 172 209"
              stroke={brown}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.42"
            />

            {/* side details */}
            {/* <path
              d="M55 149 C49 159 49 225 58 236"
              stroke={brown}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.45"
            />
            <path
              d="M245 149 C251 159 251 225 242 236"
              stroke={brown}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.45"
            /> */}

            {/* feet */}
            <path
              d="M65 242 H90 V252 H73 C68 252 65 249 65 244 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />

            <path
              d="M210 242 H235 V244 C235 249 232 252 227 252 H210 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />

            {/* hearts */}
            {/* <motion.path
              d="M20 106 C14 96 3 104 12 116 L24 129 L36 116 C45 104 32 96 26 106 L24 110 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
              animate={{ scale: [1, 1.08, 1], opacity: [0.24, 0.52, 0.24] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.path
              d="M264 106 C258 96 247 104 256 116 L268 129 L280 116 C289 104 276 96 270 106 L268 110 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
              animate={{ scale: [1, 1.08, 1], opacity: [0.24, 0.52, 0.24] }}
              transition={{
                duration: 2.2,
                delay: 0.25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            /> */}

            <motion.path
              d="M6 106 C0 96 -11 104 -2 116 L10 129 L22 116 C31 104 18 96 12 106 L10 110 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
              animate={{ scale: [1, 1.08, 1], opacity: [0.24, 0.52, 0.24] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.path
              d="M278 106 C272 96 261 104 270 116 L282 129 L294 116 C303 104 290 96 284 106 L282 110 Z"
              fill={bgFill}
              stroke={brown}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
              animate={{ scale: [1, 1.08, 1], opacity: [0.24, 0.52, 0.24] }}
              transition={{
                duration: 2.2,
                delay: 0.25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.svg>

          <motion.div
            className="absolute bottom-4 h-5 w-48 rounded-full bg-[#3A261B]/10 blur-md"
            animate={{ scaleX: [1, 0.86, 1], opacity: [0.16, 0.07, 0.16] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.p
          className="mt-1 text-sm font-semibold text-[#3A261B] sm:text-base"
          animate={{ opacity: [0.62, 1, 0.62] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          Something is baking from oven&apos;s aura
        </motion.p>

        <div className="mt-4 h-1.5 w-56 overflow-hidden rounded-full bg-[#3A261B]/10">
          <motion.div
            className="h-full rounded-full bg-[#6B4A36]"
            initial={{ x: "-100%" }}
            animate={{ x: ["-100%", "120%"] }}
            transition={{ duration: 1.65, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.section>
    </div>
  );
}
