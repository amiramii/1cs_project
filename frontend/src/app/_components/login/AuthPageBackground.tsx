import Image from "next/image"

/** Uses `dark:` so the correct asset follows system/light/dark as soon as `html` has the right class. */
export function AuthPageBackground() {
  return (
    <>
      <Image
        src="/bgC.svg"
        alt=""
        fill
        priority
        className="object-cover  -z-10 dark:hidden blur-sm"
      />
      <Image
        src="/bgCD.svg"
        alt=""
        fill
        priority
        className="object-cover  -z-10 hidden dark:block blur-sm"
      />
    </>
  )
}
