export const setVerifier = verifier => {
  localStorage.setItem('code_verifier', verifier);
};

export const getVerifier = () => {
  return localStorage.getItem('code_verifier');
};

export const deleteVerifier = () => {
  localStorage.removeItem('code_verifier');
};