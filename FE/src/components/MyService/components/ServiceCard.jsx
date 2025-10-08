import { connectServiceDirect, findAuthorizedLink } from "../utils/serviceUtils";

const ServiceCard = ({ userService, idx, onConnectWithDateRange }) => {
  const authorizedLink = findAuthorizedLink(userService);

  const handleCardClick = () => {
    if (userService?.status === "approved" && authorizedLink) {
      connectServiceDirect(userService);
    }
  };

  const handleConnectClick = (e) => {
    e.stopPropagation();
    if (authorizedLink) {
      onConnectWithDateRange(userService);
    } else {
      alert('Dịch vụ này chưa có link kết nối. Vui lòng liên hệ quản trị viên.');
    }
  };

  return (
    <div
      key={`${userService._id}_${idx}`}
      className={`bg-white rounded-2xl p-6 flex flex-col items-center shadow ${
        userService?.status === "approved" && authorizedLink
          ? "cursor-pointer hover:shadow-lg transition"
          : ""
      }`}
      onClick={handleCardClick}
    >
      <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
        <img
          src={
            userService?.service?.image && userService.service.image.trim() !== ""
              ? userService.service.image
              : "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"
          }
          alt={userService?.service?.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="font-semibold mb-2 capitalize">
        {userService?.service?.name}
      </div>
      <div className="text-sm text-gray-600 mb-2">
        Ngày đăng ký: {new Date(userService?.createdAt).toLocaleDateString("vi-VN")}
      </div>
      <button
        onClick={handleConnectClick}
        className={`rounded-full px-8 py-2 font-semibold flex items-center gap-2 transition ${
          authorizedLink 
            ? 'bg-blue-500 text-white hover:bg-blue-600' 
            : 'bg-gray-400 text-white cursor-not-allowed'
        }`}
        disabled={!authorizedLink}
      >
        {authorizedLink ? 'Kết nối' : 'Chưa có link'} <span>→</span>
      </button>
    </div>
  );
};

export default ServiceCard;
