from page_objects.LoginPage import LoginPage


def test_successful_login(driver):
    login_page = LoginPage(driver)
    login_page.open("http://localhost:5173/Signin")

    login_page.enter_username("user1")
    login_page.enter_password("password@123")
    login_page.click_submit_button()

    # Assert successful login logic (e.g., title check, element presence)
    assert "EpiCareHub" in driver.title


def test_invalid_password(driver):
    login_page = LoginPage(driver)
    login_page.open("http://localhost:5173/Signin")

    login_page.enter_username("user1")
    login_page.enter_password("pass")
    login_page.click_submit_button()

    # Assert error message
    assert "Invalid username or password" == login_page.get_error_message()

def test_invalid_(driver):
    login_page = LoginPage(driver)
    login_page.open("http://localhost:5173/Signin")

    login_page.enter_username("user2")
    login_page.enter_password("password@123")
    login_page.click_submit_button()

    # Assert error message
    assert "Invalid username or password" == login_page.get_error_message()
