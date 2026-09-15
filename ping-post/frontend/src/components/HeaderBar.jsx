import logo from '../assets/logo.png'

/**
 * Top identity strip: the GrowthFusion mark on the left, who-and-where
 * on the right.
 *
 * The account/IP block is not decoration -- when several people share a
 * login and someone asks "who changed this number", the first question
 * is which session they were in.
 */
export function HeaderBar({ user = 'Arun Rajendran', accountId = '15501825', ip = '107.180.130.1' }) {
  return (
    <div className="flex h-[62px] shrink-0 items-center justify-between bg-white px-5">
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

      <div className="text-right text-[12.5px] leading-[1.5] text-text-primary">
        <div>{user}</div>
        <div className="tnum">Account ID: {accountId}</div>
        <div className="tnum">IP Address: {ip}</div>
      </div>
    </div>
  )
}
