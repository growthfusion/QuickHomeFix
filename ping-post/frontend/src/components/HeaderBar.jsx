import logo from '../assets/logo.png'

/**
 * Top identity strip: just the GrowthFusion mark.
 *
 * Used to show a hardcoded Account ID / IP address -- placeholder data
 * with no real session behind it, since there is no login yet. Removed
 * rather than left in as a decoration that would read as real.
 */
export function HeaderBar() {
  return (
    <div className="flex h-[62px] shrink-0 items-center bg-white px-5">
      {/* The source image is 2085x626 with heavy transparent padding
          top and bottom, so sizing by height alone renders the wordmark
          tiny. Scale it up and crop the padding away instead. */}
      <div className="flex items-center overflow-hidden">
        <img
          src={logo}
          alt="GrowthFusion"
          className="h-[90px] w-auto shrink-0 object-contain"
          style={{ clipPath: 'inset(32% 0 32% 0)', marginBlock: '-30px' }}
        />
      </div>
    </div>
  )
}
