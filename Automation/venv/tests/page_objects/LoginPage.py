from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class LoginPage:
    def __init__(self, driver):
        self.driver = driver

    username_field = (By.ID, "username")
    password_field = (By.ID, "password")
    #submit_button = (By.TAG_NAME, "Button")
    #error_message = (By.CSS_SELECTOR, "p.error")

    def open(self, url):
        self.driver.get(url)

    def enter_username(self, username):
        self.driver.find_element(*self.username_field).send_keys(username)

    def enter_password(self, password):
        self.driver.find_element(*self.password_field).send_keys(password)

    def click_submit_button(self):
        # Set a timeout of 10 seconds
        wait = WebDriverWait(self.driver, 10)
        #locate the element after 10 sec, adding this for dynamically rendering elements
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "Button"))).click()
        #self.driver.find_element(*self.submit_button).click()

    def get_error_message(self):
        wait = WebDriverWait(self.driver, 10)
        error_element = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "p.error")))
        return error_element.text
