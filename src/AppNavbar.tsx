import {useEffect, useState} from "react";
import {Badge, Container, Navbar, Image} from "react-bootstrap";

export interface AppNavbarProps {
	fluid: boolean,
}

export function AppNavbar() {


	return (
		<Navbar bg="dark" variant="dark" expand="md">
			<Container fluid>
				<Navbar.Brand>Noob Chat</Navbar.Brand>
				{/* <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="#home">Home</Nav.Link>
                        <Nav.Link href="#link">Link</Nav.Link>
                        <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                            <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse> */}
				{process.env.REACT_APP_AZURE_AUTH && <AccountController />}

			</Container>
		</Navbar>
	);
}

function AccountController() {

	const [clientPrinciple, setClientPrinciple] = useState<any>();
	useEffect(() => {
		fetch('/.auth/me').then(
			(rsp) => rsp.json()
		).then(
			(payload) => setClientPrinciple(payload.clientPrincipal)
		);
	}, [setClientPrinciple])

	const [publicUserInfo, setPublicUserInfo] = useState<any>();
	useEffect(() => {
		if (!clientPrinciple) setPublicUserInfo(undefined);
		else fetch('https://api.github.com/users/' + clientPrinciple.userDetails).then(
			(rsp) => rsp.json()
		).then(
			(payload) => setPublicUserInfo(payload)
		);
	}, [clientPrinciple, setPublicUserInfo]);

	if (clientPrinciple?.identityProvider !== 'github') return (
		<Navbar.Text>
			<a href='/.auth/login/github'> Login </a>
		</Navbar.Text>
	);
	else return (
		<Navbar.Text>
			Signed in as:
			<Badge pill bg='secondary'>
				<Image src={publicUserInfo?.avatar_url} alt={'G'} height='40' width='40' roundedCircle />
				{publicUserInfo?.name}
			</Badge>
			|
			<a href='/.auth/logout'> Logout</a>
		</Navbar.Text >
	)

}
