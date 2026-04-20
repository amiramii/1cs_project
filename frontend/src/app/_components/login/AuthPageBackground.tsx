import Image from "next/image"

/** Uses `dark:` so the correct asset follows system/light/dark as soon as `html` has the right class. */
export function AuthPageBackground() {
  return (
    <>
      <Image
        src="/bg2H.svg"
        alt=""
        fill
        priority
        className="object-cover scale-x-[-1] -z-10 dark:hidden "
      />
      <Image
        src="/bgD3.svg"
        alt=""
        fill
        priority
        className="object-cover scale-x-[-1] -z-10 hidden dark:block "
      />
    </>
  )
}
