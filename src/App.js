import React, {useState, useRef, useEffect} from "react";
import {Container, Card, Form, Button, InputGroup} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const chatEndRef = useRef(null);

    // Scroll to the latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim() && !file) return;

        let userMessage;
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                userMessage = {type: "image", content: e.target.result, sender: "user"};
                setMessages((prev) => [...prev, userMessage]);
                setFile(null);
                await handleBackendResponse(userMessage);
            };
            reader.readAsDataURL(file);
        } else {
            userMessage = {type: "text", content: inputText, sender: "user"};
            setMessages((prev) => [...prev, userMessage]);
            setInputText("");
            await handleBackendResponse(userMessage);
        }
    };

    const handleBackendResponse = async (message) => {
        setLoading(true);

        try {
            const response = await fetch("http://localhost:7070/photo/chat", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(message),
            });

            const responseData = await response.json();

            if (responseData.type === "mixed") {
                const backendMessages = [];

                if (responseData.text) {
                    backendMessages.push({
                        type: "text",
                        content: responseData.text,
                        sender: "backend",
                    });
                }

                if (responseData.images && Array.isArray(responseData.images)) {
                    if (responseData.images.length > 0) {
                        backendMessages.push({type: "image", content: responseData.images, sender: "backend"});
                    }
                    /*responseData.images.forEach((image) => {
                        backendMessages.push({
                            type: "image",
                            content: image,
                            sender: "backend",
                        });
                    });*/
                }

                setMessages((prev) => [...prev, ...backendMessages]);
            }
        } catch (error) {
            console.error("Error fetching backend response:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileUpload = (e) => {
        setFile(e.target.files[0]);
    };

    return (
        <Container className="my-4">
            <Card>
                <Card.Header className="text-center">
                    <strong>Konjarla Photo Chat</strong>
                </Card.Header>
                <Card.Body style={{height: "700px", overflowY: "auto"}}>
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`message mb-3 ${
                                msg.sender === "user" ? "user-message" : "backend-message"
                            }`}
                        >
                            {msg.type === "text" ? (
                                <pre className="mb-1">{msg.content}</pre>
                            ) : msg.type === "image" && Array.isArray(msg.content) ? (
                                <div className="image-container d-flex flex-wrap gap-2">
                                    {msg.content.map((image, imgIndex) => (
                                        <a
                                            key={imgIndex}
                                            href={image}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{textDecoration: "none"}}
                                        >
                                            <img
                                                key={imgIndex}
                                                src={image}
                                                alt="Response Content"
                                                className="img-fluid rounded"
                                                style={{
                                                    maxWidth: "150px",
                                                    maxHeight: "150px",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        </a>
                                    ))}
                                </div>
                            ) : msg.type === "image" ? (
                                <img
                                    src={msg.content}
                                    alt="Response Content"
                                    className="img-fluid rounded"
                                    style={{maxWidth: "100%", maxHeight: "300px"}}
                                />
                            ) : null}
                        </div>
                    ))}
                    {loading && (
                        <div className="text-center">
                            <div className="dot-spinner">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                            <p className="mt-2 text-muted">Generating response...</p>
                        </div>
                    )}
                    <div ref={chatEndRef}/>
                </Card.Body>
                <Card.Footer>
                    <Form>
                        <InputGroup>
                            <Form.Control
                                type="text"
                                placeholder="Type a message..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyPress}
                            />
                            <Button variant="primary" onClick={handleSendMessage}>
                                Send
                            </Button>
                        </InputGroup>
                    </Form>
                </Card.Footer>
            </Card>
        </Container>
    );
}

export default App;
