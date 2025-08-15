import { GoogleLogin } from "@react-oauth/google";
import { useState, useRef, useEffect } from "react";

const CLIENT_ID = "1018980222004-m7pfvifsgidmr0eenre5epusasm8pvov.apps.googleusercontent.com";

function GoogleLoginComponent() {
  const loginDiv = useRef(null);

  useEffect(() => {
    /* global google */
    const handleCredentialResponse = (response) => {
      // The credential is a JWT. Decode for user info, or send to backend for verification.
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      const userObject = JSON.parse(jsonPayload);

      setUser(userObject);
      setAccessToken(response.credential);
    };

    // Load Google script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google && loginDiv.current) {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(loginDiv.current, { theme: "outline", size: "large" });
      }
    };
    document.body.appendChild(script);

    // Cleanup
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      {!user && <div ref={loginDiv}></div>}
      {user && (
        <div>
          <h3>Welcome, {user.name}</h3>
          <p>Email: {user.email}</p>
          {/* For demonstration: */}
          <pre>Access Token/JWT: {accessToken}</pre>
        </div>
      )}
    </div>
  );
}

export default GoogleLoginComponent;