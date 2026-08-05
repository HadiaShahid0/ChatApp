import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BsCameraFill } from "react-icons/bs";
import {
  getCurrentUser,
  updateProfile,
  uploadProfileImage,
} from "../services/profileServices";

const Profile = () => {
  const { currentUser } = useOutletContext();

  const [user, setUser] = useState(currentUser);
  const [name, setName] = useState(currentUser?.name || "");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(currentUser);
    setName(currentUser.name);

    setPreviewImage(
      currentUser.profileImage
        ? `http://localhost:5000/${currentUser.profileImage}?t=${Date.now()}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            currentUser.name
          )}&background=0D6EFD&color=fff&size=200`
    );
  }, [currentUser]);

  const loadUser = async () => {
    try {
      const response = await getCurrentUser();

      if (response.success) {
        setUser(response.user);
        setName(response.user.name);

        setPreviewImage(
          response.user.profileImage
            ? `http://localhost:5000/${response.user.profileImage}?t=${Date.now()}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                response.user.name
              )}&background=0D6EFD&color=fff&size=200`
        );
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (name !== user.name) {
        await updateProfile(name);
      }

      if (selectedImage) {
        await uploadProfileImage(selectedImage);
      }

      await loadUser();

      setSelectedImage(null);

      alert("Profile updated successfully.");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container d-flex align-items-center py-5">
      <div className="row justify-content-center w-100">
        <div className="col-lg-8">
          <div
            className="card border-0 shadow-lg rounded-4"
            style={{ overflow: "hidden" }}
          >
            {/* Header */}
            <div className="card-header bg-dark text-white text-center py-4">
              <h5 className="mb-0">My Profile</h5>
            </div>

            {/* Body */}
            <div className="card-body p-5">
              <div className="row align-items-center">
                {/* Profile Image */}
                <div className="col-md-5 text-center mb-4 mb-md-0">
                  <div className="position-relative d-inline-block">
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="rounded-circle shadow"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        border: "5px solid white",
                      }}
                    />

                    <label
                      className="btn position-absolute bg-success rounded-circle d-flex justify-content-center align-items-center"
                      style={{
                        bottom: 10,
                        right: 10,
                        width: 45,
                        height: 45,
                        cursor: "pointer",
                      }}
                    >
                      <BsCameraFill size={22} />

                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>

                {/* User Info */}
                <div className="col-md-7">
                  <h6 className="fw-bold">{user.name}</h6>

                  <p className="text-muted">{user.email}</p>

                  <span
                    className={`badge rounded-pill px-3 py-2 ${
                      user.status === "online"
                        ? "bg-success"
                        : "bg-secondary"
                    }`}
                  >
                    {user.status === "online" ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              <hr className="my-5" />

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Full Name
                </label>

                <input
                  type="text"
                  className="form-control form-control-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Email Address
                </label>

                <input
                  type="email"
                  className="form-control form-control-lg"
                  value={user.email}
                  disabled
                />
              </div>

              <div className="text-center">
                <button
                  className="btn btn-primary btn-lg px-5"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;