import { useNavigate } from "react-router-dom";
import CreatePost from "./CreatePost";

const CreatePostPage = () => {
  const navigate = useNavigate();

  const handlePostCreated = () => {
    // Navigate back to feed after successful post creation
    navigate('/portal');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <CreatePost onPostCreated={handlePostCreated} />
    </div>
  );
};

export default CreatePostPage;